import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register-patient")({
  head: () => ({ meta: [{ title: "Cadastro paciente — Solaris" }] }),
  component: RegisterPatient,
});

function RegisterPatient() {
  const navigate = useNavigate();
  const { brand, loadByAccessCode } = useWhiteLabel();
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
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
        email: form.email,
        password: form.password,
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
    <div className="min-h-screen bg-night text-white grid place-items-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl font-bold" style={{ background: "var(--clinic-primary)" }}>
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : "S"}
          </div>
          <span className="font-display text-xl font-bold">{brand.name}</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          {step === 1 ? (
            <>
              <h1 className="font-display text-2xl font-bold">Bem-vindo</h1>
              <p className="mt-1 text-sm text-white/60">Digite o código fornecido pelo seu médico.</p>
              <form onSubmit={checkCode} className="mt-6 space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm">
                  <span className="text-white/50">SLR-</span>
                  <input
                    autoFocus value={code.replace(/^SLR-/, "")}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
                    placeholder="4829" maxLength={4}
                    className="flex-1 bg-transparent tracking-widest focus:outline-none"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-medium text-primary-foreground transition disabled:opacity-50"
                  style={{ background: "var(--clinic-primary)" }}
                >
                  {loading ? "Verificando..." : "Continuar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Crie sua conta</h1>
              <p className="mt-1 text-sm text-white/60">Clínica: <span className="text-white">{brand.name}</span></p>
              <form onSubmit={onSignup} className="mt-6 space-y-4">
                {[
                  { k: "fullName", label: "Nome completo", type: "text" },
                  { k: "email", label: "E-mail", type: "email" },
                  { k: "password", label: "Senha", type: "password" },
                ].map((f) => (
                  <div key={f.k}>
                    <label className="text-xs font-medium text-white/70">{f.label}</label>
                    <input
                      type={f.type} required value={(form as any)[f.k]}
                      onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "transparent" }}
                    />
                  </div>
                ))}
                <button
                  type="submit" disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-medium text-primary-foreground transition disabled:opacity-50"
                  style={{ background: "var(--clinic-primary)" }}
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </form>
            </>
          )}
          <div className="mt-4 text-center text-sm text-white/60">
            Já tem conta? <Link to="/auth/login" className="text-primary hover:underline">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
