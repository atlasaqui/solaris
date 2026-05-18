import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MessageCircle, Send, Save, Mail, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/patients/$id")({
  head: () => ({ meta: [{ title: "Paciente" }] }),
  component: PatientDetail,
});

type Patient = {
  id: string; full_name: string; email: string; phone: string | null;
  avatar_url: string | null; city: string | null; state: string | null;
};
type Photo = {
  id: string; week_number: number; angle: string; storage_path: string;
  taken_at: string; doctor_comment: string | null; improvement_score: number | null;
};
type Comment = { id: string; content: string; created_at: string; doctor_id: string | null; patient_id: string | null };

function PatientDetail() {
  const { id } = Route.useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [photos, setPhotos] = useState<(Photo & { url: string })[]>([]);
  const [messages, setMessages] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: ph }, { data: msg }] = await Promise.all([
      supabase.from("patients").select("id, full_name, email, phone, avatar_url, city, state").eq("id", id).maybeSingle(),
      supabase.from("evolution_photos").select("*").eq("patient_id", id).order("week_number", { ascending: false }),
      supabase.from("clinical_comments").select("id, content, created_at, doctor_id, patient_id").eq("patient_id", id).order("created_at", { ascending: true }),
    ]);
    setPatient(p as Patient | null);
    const rows = (ph ?? []) as Photo[];
    const withUrls = await Promise.all(rows.map(async (r) => {
      const { data: signed } = await supabase.storage.from("evolution-photos").createSignedUrl(r.storage_path, 3600);
      return { ...r, url: signed?.signedUrl ?? "" };
    }));
    setPhotos(withUrls);
    setMessages((msg ?? []) as Comment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: doc } = await supabase.from("doctors").select("id").eq("user_id", u.user!.id).maybeSingle();
    const { error } = await supabase.from("clinical_comments").insert({
      patient_id: id,
      doctor_id: doc?.id,
      content: body,
      is_visible_to_patient: true,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    await load();
  };

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!patient) return <div className="text-sm text-muted-foreground">Paciente não encontrado.</div>;

  return (
    <div className="space-y-6">
      <Link to="/admin/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary">
          {patient.avatar_url ? <img src={patient.avatar_url} alt="" className="h-full w-full object-cover" /> : patient.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-semibold">{patient.full_name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {patient.email}</span>
            {patient.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {patient.phone}</span>}
            {patient.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {patient.city}{patient.state ? `/${patient.state}` : ""}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photos timeline */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 font-display text-base font-semibold">Linha do tempo · Fotos</h2>
          {photos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Sem fotos ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {photos.map((p) => (
                <PhotoReviewCard key={p.id} photo={p} onSaved={load} />
              ))}
            </div>
          )}
        </section>

        {/* Chat */}
        <section className="lg:col-span-1">
          <h2 className="mb-3 font-display text-base font-semibold">Conversa</h2>
          <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 p-4">
              {messages.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  <div><MessageCircle className="mx-auto h-7 w-7" /><p className="mt-2">Sem mensagens ainda.</p></div>
                </div>
              ) : messages.map((m) => {
                const fromDoctor = !!m.doctor_id;
                return (
                  <div key={m.id} className={`flex ${fromDoctor ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                      fromDoctor ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
                    }`}>
                      <div>{m.content}</div>
                      <div className={`mt-1 text-[10px] ${fromDoctor ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-border bg-card p-3">
              <input
                value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Responder ao paciente..."
                className="flex-1 rounded-full border border-border bg-secondary/40 px-4 py-2 text-[13px] outline-none focus:border-primary"
              />
              <button onClick={send} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PhotoReviewCard({ photo, onSaved }: { photo: Photo & { url: string }; onSaved: () => void }) {
  const [comment, setComment] = useState(photo.doctor_comment ?? "");
  const [score, setScore] = useState<string>(photo.improvement_score != null ? String(photo.improvement_score) : "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("evolution_photos").update({
      doctor_comment: comment.trim() || null,
      improvement_score: score.trim() === "" ? null : Number(score),
      reviewed_at: new Date().toISOString(),
      reviewed_by: u.user?.id,
    }).eq("id", photo.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Revisão salva");
    onSaved();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Semana {photo.week_number}</span>
          <span className="text-xs text-muted-foreground capitalize">{photo.angle.replace("_", " ")}</span>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(photo.taken_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="aspect-square bg-[#0F172A]">
          {photo.url && <img src={photo.url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Comentário clínico</label>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Observações para o paciente..."
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">% melhora</label>
              <input
                type="number" min={0} max={100} step="0.1"
                value={score} onChange={(e) => setScore(e.target.value)}
                placeholder="0–100"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
