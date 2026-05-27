import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth/register-patient")({
  head: () => ({ meta: [{ title: "Cadastro paciente — Solaris" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ code: typeof s.code === "string" ? s.code : undefined }),
  component: RegisterPatient,
});

function RegisterPatient() {
  const navigate = useNavigate();
  const { brand, loadByAccessCode } = useWhiteLabel();
  const { code: presetCode } = Route.useSearch();
  const [step, setStep] = useState<1 | 2>(presetCode ? 1 : 1);
  const [code, setCode] = useState(presetCode ?? "");
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const full = code.startsWith("SLR-") ? code.toUpperCase() : `SLR-${code}`;
    const clinic = await loadByAccessCode(full);
    setLoading(false);
    if (!clinic?.id) return toast.error("Código não encontrado");
    setClinicId(clinic.id);
    setStep(2);
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    setLoading(true);
    try {
      const { data: auth, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      const userId = auth.user?.id;
      if (!userId) throw new Error("Usuário não criado");
      const { error: pErr } = await supabase.from("patients").insert({
        user_id: userId, clinic_id: clinicId,
        full_name: form.fullName, email: form.email,
      });
      if (pErr) throw pErr;
      toast.success("Conta criada!");
      navigate({ to: "/app/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setLoading(false);
    }
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
            <div className="text-[13px] opacity-80">{step === 1 ? "Vamos começar" : "Crie sua conta"}</div>
            <div className="text-2xl font-extrabold">{brand.name}</div>
          </div>
        </div>
      </div>

      <div className="-mt-6 mx-4 rounded-3xl bg-white p-6 shadow-xl">
        {step === 1 ? (
          <>
            <h1 className="text-xl font-extrabold" style={{ color: "var(--text-dark)" }}>Código da clínica</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-medium)" }}>
              Digite o código fornecido pelo seu médico.
            </p>
            <form onSubmit={checkCode} className="mt-6 space-y-4">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 font-mono">
                <KeyRound className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">SLR-</span>
                <input
                  autoFocus value={code.replace(/^SLR-/, "")}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
                  placeholder="4829" maxLength={4}
                  className="flex-1 bg-transparent tracking-[0.3em] text-sm outline-none"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
                style={{ background: "var(--clinic-primary)" }}
              >
                {loading ? "Verificando..." : "Continuar"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold" style={{ color: "var(--text-dark)" }}>Seus dados</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-medium)" }}>
              Clínica:{" "}
              <span className="font-semibold" style={{ color: "var(--clinic-primary)" }}>{brand.name}</span>
            </p>
            <form onSubmit={onSignup} className="mt-6 space-y-4">
              <Field icon={<User className="h-4 w-4" />}>
                <input
                  type="text" required value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </Field>
              <Field icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="E-mail"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </Field>
              <Field icon={<Lock className="h-4 w-4" />}>
                <input
                  type={show ? "text" : "password"} required minLength={6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Senha (mín. 6 caracteres)"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="text-gray-400">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>
              <button
                type="submit" disabled={loading}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
                style={{ background: "var(--clinic-primary)" }}
              >
                {loading ? "Criando..." : "Criar conta"}
              </button>
            </form>
          </>
        )}
        <div className="mt-5 text-center text-sm" style={{ color: "var(--text-medium)" }}>
          Já tem conta?{" "}
          <Link to="/auth/login" className="font-semibold" style={{ color: "var(--clinic-primary)" }}>
            Entrar
          </Link>
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
