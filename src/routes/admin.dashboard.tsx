import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Camera, BookOpen, AlertCircle, Plus, Pencil, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Solaris" }] }),
  component: Dashboard,
});

type ClinicHero = { name: string; doctor_name: string; logo_url: string | null };

function Dashboard() {
  const [clinic, setClinic] = useState<ClinicHero | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!doc?.clinic_id) return;
      const { data } = await supabase.from("clinics").select("name, doctor_name, logo_url").eq("id", doc.clinic_id).single();
      setClinic(data as ClinicHero | null);
    })();
  }, []);

  return (
    <div className="space-y-8">
      {/* HERO BANNER */}
      <section
        className="relative flex items-center justify-between overflow-hidden rounded-2xl px-6 text-white"
        style={{
          minHeight: 120,
          background:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), #0A1628",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 font-display text-xl font-bold ring-1 ring-white/15">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (clinic?.name ?? "S").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="font-display text-[24px] font-bold leading-tight">{clinic?.name ?? "Sua clínica"}</div>
            <div className="text-[14px] font-normal text-white/70">{clinic?.doctor_name ?? "—"}</div>
          </div>
        </div>
        <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
          <a
            href="/app/clinic-profile"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" /> Ver como paciente vê
          </a>
          <Link
            to="/admin/profile"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0A1628] transition hover:bg-white/90"
          >
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
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Novo paciente
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Pacientes ativos", value: "0", tint: "text-primary" },
          { icon: Camera, label: "Fotos esta semana", value: "0", tint: "text-info" },
          { icon: BookOpen, label: "Posts publicados", value: "0", tint: "text-warning" },
          { icon: AlertCircle, label: "Pendentes revisão", value: "0", tint: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <s.icon className={`h-5 w-5 ${s.tint}`} />
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <h2 className="font-display text-xl font-semibold">Comece configurando sua clínica</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Personalize o perfil público, publique seu primeiro conteúdo e convide pacientes.
        </p>
      </div>
    </div>
  );
}
