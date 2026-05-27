import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Entrar — Solaris" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { brand } = useWhiteLabel();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    const userId = data.user?.id;
    if (!userId) return;
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).maybeSingle();
    navigate({ to: doctor ? "/admin/dashboard" : "/app/home" });
  };

  return (
    <div className="patient-app min-h-screen" style={{ background: "var(--bg-page)" }}>
      <div className="relative px-6 pt-12 pb-10" style={{ background: "var(--clinic-primary)" }}>
        <Link to="/" className="inline-flex items-center gap-1 text-white/90 text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur text-white font-bold text-2xl overflow-hidden">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" /> : brand.name[0]}
          </div>
          <div className="text-white">
            <div className="text-[13px] opacity-80">Bem-vindo de volta</div>
            <div className="text-2xl font-extrabold">{brand.name}</div>
          </div>
        </div>
      </div>

      <div className="-mt-6 mx-4 rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-extrabold" style={{ color: "var(--text-dark)" }}>Entrar</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-medium)" }}>Acesse sua conta para continuar.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field icon={<Mail className="h-4 w-4" />}>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="text-gray-400">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          <button
            disabled={loading} type="submit"
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
            style={{ background: "var(--clinic-primary)" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm" style={{ color: "var(--text-medium)" }}>
          <div>
            Sou paciente —{" "}
            <Link to="/auth/register-patient" className="font-semibold" style={{ color: "var(--clinic-primary)" }}>
              tenho um código
            </Link>
          </div>
          <div>
            Sou médico —{" "}
            <Link to="/auth/register-doctor" className="font-semibold" style={{ color: "var(--clinic-primary)" }}>
              criar clínica
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
      <span className="text-gray-400">{icon}</span>
      {children}
    </div>
  );
}
