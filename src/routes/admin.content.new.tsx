import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { ArrowLeft, Bold, FileImage, ImagePlus, Italic, Loader2, Save, Send, Video } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { uploadToStorageWithProgress } from "@/lib/storage-upload";
import { VideoEditorPanel } from "./admin.content.video-editor";

const TYPES = ["article", "video", "tip", "protocol"] as const;
type ContentType = (typeof TYPES)[number];
const CATEGORIES = ["Skincare", "Acne", "Melasma", "Procedimentos", "Proteção solar", "Cuidados diários"];

export const Route = createFileRoute("/admin/content/new")({
  head: () => ({ meta: [{ title: "Novo conteúdo" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    const t = search.type;
    return { type: (TYPES as readonly string[]).includes(t as string) ? (t as ContentType) : undefined };
  },
  component: NewContent,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

type Condition = { id: string; name: string; slug: string };

function NewContent() {
  const navigate = useNavigate();
  const { type: initialType } = Route.useSearch();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [coverProgress, setCoverProgress] = useState(0);
  const [inlineProgress, setInlineProgress] = useState(0);
  const [form, setForm] = useState({
    type: (initialType ?? "article") as ContentType,
    title: "",
    category: CATEGORIES[0],
    summary: "",
    cover_image_url: "",
    read_time_minutes: 4,
    related_condition_id: "",
  });

  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false })],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[260px] rounded-b-xl border-x border-b border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none prose prose-sm max-w-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: doc } = await supabase.from("doctors").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!doc?.clinic_id) return;
      setClinicId(doc.clinic_id);
      setAuthorId(doc.id);
      const { data: wiki } = await supabase.from("wiki_conditions")
        .select("id, name, slug")
        .eq("clinic_id", doc.clinic_id)
        .order("name", { ascending: true });
      setConditions((wiki ?? []) as Condition[]);
    })();
  }, []);

  const isVideo = form.type === "video";
  const selectedCondition = useMemo(
    () => conditions.find((c) => c.id === form.related_condition_id),
    [conditions, form.related_condition_id],
  );

  const uploadImage = async (file: File, mode: "cover" | "inline") => {
    if (!clinicId) { toast.error("Clínica não encontrada"); return null; }
    if (!["image/jpeg", "image/png"].includes(file.type)) { toast.error("Use JPG ou PNG"); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return null; }
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${clinicId}/${mode}-${crypto.randomUUID()}.${ext}`;
    const setProgress = mode === "cover" ? setCoverProgress : setInlineProgress;
    setProgress(1);
    try {
      await uploadToStorageWithProgress({
        bucket: "content-covers",
        path,
        file,
        contentType: file.type,
        onProgress: setProgress,
      });
      const { data } = supabase.storage.from("content-covers").getPublicUrl(path);
      toast.success(mode === "cover" ? "Capa enviada" : "Imagem inserida");
      return data.publicUrl;
    } catch (error: any) {
      toast.error(error.message ?? "Falha no upload");
      return null;
    } finally {
      setTimeout(() => setProgress(0), 700);
    }
  };

  const onCoverFile = async (file?: File) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, cover_image_url: localPreview }));
    const publicUrl = await uploadImage(file, "cover");
    if (publicUrl) setForm((prev) => ({ ...prev, cover_image_url: publicUrl }));
  };

  const onInlineFile = async (file?: File) => {
    if (!file || !editor) return;
    const publicUrl = await uploadImage(file, "inline");
    if (publicUrl) editor.chain().focus().setImage({ src: publicUrl, alt: form.title || "Imagem do conteúdo" }).run();
  };

  const validate = () => {
    if (!clinicId) return "Clínica não encontrada";
    if (!form.title.trim()) return "Informe o título";
    if (!form.type) return "Selecione o tipo";
    if (!isVideo && !editor?.getText().trim()) return "Escreva o conteúdo do post";
    return null;
  };

  const submitPost = async (publish: boolean) => {
    const errorMessage = validate();
    if (errorMessage) { toast.error(errorMessage); return; }
    setSaving(publish ? "publish" : "draft");
    const title = form.title.trim();
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("content_posts").insert({
      clinic_id: clinicId,
      author_id: authorId,
      type: form.type,
      title,
      slug,
      category: form.category || null,
      summary: form.summary.trim() || null,
      content: editor?.getHTML() ?? "",
      cover_image_url: form.cover_image_url.startsWith("blob:") ? null : form.cover_image_url || null,
      read_time_minutes: form.read_time_minutes,
      related_condition_id: form.related_condition_id || null,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    });
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success(publish ? "Conteúdo publicado" : "Rascunho salvo");
    navigate({ to: "/admin/content/list" });
  };

  if (isVideo) return <VideoEditorPanel embedded />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/admin/content" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex gap-2">
          <button type="button" disabled={!!saving} onClick={() => submitPost(false)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60">
            {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar rascunho
          </button>
          <button type="button" disabled={!!saving} onClick={() => submitPost(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
            {saving === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar
          </button>
        </div>
      </div>

      <header>
        <h1 className="font-display text-2xl font-semibold">Novo conteúdo</h1>
        <p className="text-sm text-muted-foreground">Posts educativos visíveis aos pacientes</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <Field label="Tipo">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${form.type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                {t === "article" ? "Artigo" : t === "video" ? "Vídeo" : t === "tip" ? "Dica" : "Protocolo"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Título"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Condição vinculada">
            <select value={form.related_condition_id} onChange={(e) => setForm({ ...form, related_condition_id: e.target.value })} className={inputCls}>
              <option value="">Nenhuma</option>
              {conditions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        {selectedCondition && <div className="rounded-xl bg-primary-light px-3 py-2 text-xs font-semibold text-primary">Será exibido com badge: {selectedCondition.name}</div>}
        <Field label="Resumo"><textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className={inputCls} /></Field>
        <Field label="Imagem de capa">
          <label className="block cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-background hover:border-primary">
            {form.cover_image_url ? <img src={form.cover_image_url} alt="Preview da capa" className="aspect-video w-full object-cover" /> : (
              <div className="grid aspect-video place-items-center text-sm text-muted-foreground"><FileImage className="mb-2 h-7 w-7" /> JPG ou PNG até 5MB</div>
            )}
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onCoverFile(e.target.files?.[0])} />
          </label>
          {coverProgress > 0 && <Progress value={coverProgress} />}
        </Field>
        <Field label="Tempo de leitura (min)">
          <input type="number" min={1} max={60} value={form.read_time_minutes} onChange={(e) => setForm({ ...form, read_time_minutes: Number(e.target.value) })} className={inputCls} />
        </Field>
        <div>
          <div className="flex items-center justify-between rounded-t-xl border border-input bg-secondary px-2 py-2">
            <div className="flex gap-1">
              <ToolbarButton active={!!editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton active={!!editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-xs font-semibold hover:bg-card">
              <ImagePlus className="h-4 w-4" /> Inserir foto
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onInlineFile(e.target.files?.[0])} />
            </label>
          </div>
          <EditorContent editor={editor} />
          {inlineProgress > 0 && <Progress value={inlineProgress} />}
        </div>
      </section>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}

function Progress({ value }: { value: number }) {
  return <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${value}%` }} /></div>;
}

function ToolbarButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}>{children}</button>;
}