import { createFileRoute } from "@tanstack/react-router";
import { Users, Camera, BookOpen, AlertCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Solaris" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-8">
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
