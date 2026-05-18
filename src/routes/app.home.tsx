import { createFileRoute, Link } from "@tanstack/react-router";
import { Sun, Camera, BookOpen, Building2, Search, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Início" }] }),
  component: Home,
});

function Home() {
  return (
    <div className="space-y-4">
      {/* UV Widget */}
      <div className="rounded-2xl p-5 text-white shadow-lift" style={{ background: "var(--clinic-primary)" }}>
        <div className="flex items-center justify-between text-xs text-white/80">
          <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> Índice UV agora</span>
          <span>📍 Sua cidade</span>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <div className="font-display text-5xl font-bold">—</div>
          <div className="pb-2 text-sm text-white/80">Ative a localização</div>
        </div>
        <button className="mt-4 w-full rounded-lg bg-white/15 py-2.5 text-sm font-medium backdrop-blur">
          ☀️ Registrar proteção solar
        </button>
      </div>

      {/* Foto da semana */}
      <Link to="/app/camera" className="block rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Foto desta semana</div>
            <div className="text-xs text-muted-foreground">Mantenha o registro de evolução</div>
          </div>
          <span className="text-sm text-primary">→</span>
        </div>
      </Link>

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/app/wiki/search", icon: Search, label: "Pesquisar", sub: "Doenças" },
          { to: "/app/evolution", icon: TrendingUp, label: "Evolução", sub: "Ver progresso" },
          { to: "/app/content/feed", icon: BookOpen, label: "Biblioteca", sub: "Conteúdos" },
          { to: "/app/clinic-profile", icon: Building2, label: "Clínica", sub: "Ver perfil" },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <s.icon className="h-5 w-5 text-primary" />
            <div className="mt-2 text-sm font-semibold">{s.label}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
