import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Camera, BookOpen, Sun, Stethoscope, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solaris — Ecossistema dermatológico white label" },
      { name: "description", content: "Construa o app da sua clínica em minutos. Biblioteca de conteúdo, evolução fotográfica, wiki clínica e alertas UV — com sua marca." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* NAV */}
      <nav className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">S</div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">Solaris</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900">Recursos</a>
            <a href="#how" className="text-sm text-slate-600 hover:text-slate-900">Como funciona</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Planos</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="text-sm text-slate-700 hover:text-slate-900">Entrar</Link>
            <Link
              to="/auth/register-doctor"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
            >
              Criar minha clínica
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="relative"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(20,114,208,0.12), transparent 60%), radial-gradient(ellipse at bottom left, rgba(14,165,233,0.08), transparent 55%), #ffffff",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-32 pt-20 lg:grid-cols-2 lg:items-center lg:pt-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
              <Sparkles className="h-3 w-3 text-primary" />
              White label · Pronto em minutos
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
              O app da sua clínica.{" "}
              <span className="text-gradient-clinic">Com a sua marca.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Pacientes, biblioteca de conteúdo, wiki clínica, evolução fotográfica e alertas UV —
              num único ecossistema que reflete a identidade da sua clínica.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/auth/register-doctor"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
              >
                Começar gratuitamente
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/auth/register-patient"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-medium text-slate-900 transition hover:bg-slate-50"
              >
                Sou paciente
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> LGPD compliant</span>
              <span>· 14 dias grátis</span>
              <span>· Sem cartão</span>
            </div>
          </div>

          {/* Mock phone */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-8 rounded-[3rem] bg-primary/15 blur-3xl" />
            <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
              <div className="h-full overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-primary/90 to-primary-dark p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-sm font-bold">PV</div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">Clínica Pele Viva</div>
                      <div className="text-[10px] text-white/70">Dra. Marina Costa</div>
                    </div>
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-xs">🔔</div>
                </div>
                <div className="mt-5 rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <div className="text-xs text-white/70">Índice UV agora · Recife</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="font-display text-5xl font-bold">8</div>
                    <div className="pb-2 text-sm text-white/80">Alto · 32°</div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/15">
                    <div className="h-full w-3/4 rounded-full bg-warning" />
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-white p-4 text-foreground">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Camera className="h-3.5 w-3.5" /> Foto da semana 4/8
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div className="h-full w-1/2 rounded-full bg-primary" />
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">Toque para registrar →</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-foreground">
                  <div className="rounded-xl bg-white p-3 text-xs">📖 Biblioteca</div>
                  <div className="rounded-xl bg-white p-3 text-xs">🏥 Clínica</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-slate-200 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-sm font-medium text-primary">Tudo em um lugar</div>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Construído para clínicas modernas.
            </h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-slate-200 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Stethoscope, title: "Painel do especialista", desc: "Pacientes, comentários clínicos e revisão semanal de fotos." },
              { icon: BookOpen, title: "Biblioteca curada", desc: "Publique artigos, vídeos, dicas e protocolos para seus pacientes." },
              { icon: Camera, title: "Evolução fotográfica", desc: "Câmera com máscara-guia. Compare semana 1 com semana 8." },
              { icon: Sun, title: "Alertas UV", desc: "Notificação automática quando o índice UV sobe na região do paciente." },
              { icon: Sparkles, title: "Wiki da clínica", desc: "Você explica cada condição com seus próprios vídeos." },
              { icon: ShieldCheck, title: "White label total", desc: "Cores, logo, banner e domínio com a identidade da sua clínica." },
            ].map((f) => (
              <div key={f.title} className="group bg-white p-8 transition hover:bg-slate-50">
                <f.icon className="h-7 w-7 text-primary" />
                <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Pronto para lançar o app da sua clínica?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Crie sua conta, personalize as cores e convide seus pacientes hoje mesmo.
          </p>
          <Link
            to="/auth/register-doctor"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
          >
            Criar minha clínica agora <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Solaris · Ecossistema dermatológico white label
      </footer>
    </div>
  );
}
