import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users, Camera, BookOpen, AlertCircle, Plus, Pencil, ExternalLink,
  Copy, Check, Send, Heart, MessageCircle, Eye, Play,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Solaris" }] }),
  component: Dashboard,
});

type ClinicHero = { id: string; name: string; doctor_name: string; logo_url: string | null; access_code: string };
type PostRow = {
  id: string; title: string; type: string; cover_image_url: string | null;
  video_thumbnail_url: string | null; is_published: boolean; published_at: string | null;
  view_count: number | null; like_count: number | null; comment_count: number | null;
};

function Dashboard() {
  const [clinic, setClinic] = useState<ClinicHero | null>(null);
  const [stats, setStats] = useState({ patients: 0, photosWeek: 0, posts: 0, pending: 0 });
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!doc?.clinic_id) return;
      const { data: c } = await supabase.from("clinics").select("id, name, doctor_name, logo_url, access_code").eq("id", doc.clinic_id).single();
      setClinic(c as ClinicHero | null);

      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ count: patients }, { count: photosWeek }, { count: postsCount }, { count: pending }, { data: postRows }] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", doc.clinic_id).eq("status", "active"),
        supabase.from("evolution_photos").select("id", { count: "exact", head: true }).eq("clinic_id", doc.clinic_id).gte("taken_at", since),
        supabase.from("content_posts").select("id", { count: "exact", head: true }).eq("clinic_id", doc.clinic_id).eq("is_published", true),
        supabase.from("evolution_photos").select("id", { count: "exact", head: true }).eq("clinic_id", doc.clinic_id).is("reviewed_at", null),
        supabase.from("content_posts")
          .select("id, title, type, cover_image_url, video_thumbnail_url, is_published, published_at, view_count, like_count, comment_count")
          .eq("clinic_id", doc.clinic_id).eq("is_published", true)
          .order("published_at", { ascending: false }).limit(6),
      ]);
      setStats({ patients: patients ?? 0, photosWeek: photosWeek ?? 0, posts: postsCount ?? 0, pending: pending ?? 0 });
      setPosts((postRows ?? []) as PostRow[]);
    })();
  }, []);

  const inviteUrl = useMemo(() => {
    if (!clinic?.access_code) return "";
    const code = clinic.access_code.replace(/^SLR-/, "");
    if (typeof window === "undefined") return `/auth/register-patient?code=${code}`;
    return `${window.location.origin}/auth/register-patient?code=${code}`;
  }, [clinic?.access_code]);

  return (
    <div className="space-y-8">
      {/* HERO BANNER */}
      <section
        className="relative flex items-center justify-between overflow-hidden rounded-2xl px-6 text-white"
        style={{
          minHeight: 120,
          background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), #0A1628",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 font-display text-xl font-bold ring-1 ring-white/15">
            {clinic?.logo_url ? <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" /> : (clinic?.name ?? "S").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display text-[24px] font-bold leading-tight">{clinic?.name ?? "Sua clínica"}</div>
            <div className="text-[14px] font-normal text-white/70">{clinic?.doctor_name ?? "—"}</div>
          </div>
        </div>
        <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
          <a href="/app/clinic-profile" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10">
            <ExternalLink className="h-4 w-4" /> Ver como paciente vê
          </a>
          <Link to="/admin/profile"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0A1628] transition hover:bg-white/90">
            <Pencil className="h-4 w-4" /> Editar perfil da clínica
          </Link>
        </div>
      </section>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Novo paciente
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Pacientes ativos", value: stats.patients, tint: "text-primary" },
          { icon: Camera, label: "Fotos esta semana", value: stats.photosWeek, tint: "text-info" },
          { icon: BookOpen, label: "Posts publicados", value: stats.posts, tint: "text-warning" },
          { icon: AlertCircle, label: "Pendentes revisão", value: stats.pending, tint: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <s.icon className={`h-5 w-5 ${s.tint}`} />
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* PUBLICATIONS + ENGAGEMENT */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Publicações da clínica</h2>
            <p className="text-sm text-muted-foreground">Interações dos pacientes em tempo real</p>
          </div>
          <Link to="/admin/content" className="text-sm font-semibold text-primary hover:underline">Ver tudo</Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">Nenhum post publicado ainda</h3>
            <p className="mt-1 text-sm text-muted-foreground">Publique seu primeiro conteúdo para os pacientes verem aqui.</p>
            <Link to="/admin/content/new" search={{ type: "article" }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <Plus className="h-4 w-4" /> Criar conteúdo
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-md">
                <div className="relative aspect-video w-full bg-secondary">
                  {(p.video_thumbnail_url || p.cover_image_url) ? (
                    <img src={p.video_thumbnail_url || p.cover_image_url || ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">Sem capa</div>
                  )}
                  {p.type === "video" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/15">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#0A1628]">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <span className="inline-block rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{p.type}</span>
                  <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug">{p.title}</h3>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-500" /> {p.like_count ?? 0}</span>
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-primary" /> {p.comment_count ?? 0}</span>
                    <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {p.view_count ?? 0}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} clinic={clinic} inviteUrl={inviteUrl} />
    </div>
  );
}

function InviteDialog({
  open, onOpenChange, clinic, inviteUrl,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  clinic: ClinicHero | null; inviteUrl: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = async (value: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "code" ? "Código copiado" : "Link copiado");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const whatsappText = encodeURIComponent(
    `Olá! Você foi convidado(a) para acompanhar seu tratamento na ${clinic?.name ?? "nossa clínica"}.\n\n` +
    `Cadastre-se aqui: ${inviteUrl}\n\n` +
    `Ou use o código de acesso: ${clinic?.access_code ?? ""}`
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden p-0 sm:rounded-2xl">
        <div className="relative overflow-hidden px-6 pt-6 pb-5 text-white" style={{ background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.08), transparent 60%), #0A1628" }}>
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-display text-xl font-semibold text-white">Convidar paciente</DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              Compartilhe o código ou o link. O paciente cria a conta e entra direto na sua clínica.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código da clínica</div>
            <div className="flex items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-secondary px-4 font-mono text-lg font-bold tracking-[0.2em] text-foreground">
                {clinic?.access_code ?? "—"}
              </div>
              <button
                type="button"
                onClick={() => clinic?.access_code && copy(clinic.access_code, "code")}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover"
                aria-label="Copiar código"
              >
                {copied === "code" ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Link de convite</div>
            <div className="flex items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-secondary px-4">
                <span className="truncate text-xs text-foreground">{inviteUrl || "—"}</span>
              </div>
              <button
                type="button"
                onClick={() => inviteUrl && copy(inviteUrl, "link")}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-card transition hover:bg-secondary"
                aria-label="Copiar link"
              >
                {copied === "link" ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            <Send className="h-4 w-4" /> Enviar pelo WhatsApp
          </a>

          <p className="text-center text-xs text-muted-foreground">
            Após o cadastro, o paciente aparece em <Link to="/admin/patients" className="font-semibold text-primary hover:underline">Pacientes</Link>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
