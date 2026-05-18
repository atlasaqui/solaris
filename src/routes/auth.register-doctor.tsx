import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register-doctor")({
  head: () => ({ meta: [{ title: "Criar clínica — Solaris" }] }),
  component: RegisterDoctor,
});

function genCode() {
  return "SLR-" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function RegisterDoctor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", clinicName: "", email: "", password: "", crm: "",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authErr) throw authErr;
      const userId = auth.user?.id;
      if (!userId) throw new Error("Usuário não criado");

      const accessCode = genCode();
      const { data: clinic, error: clinicErr } = await supabase
        .from("clinics")
        .insert({ name: form.clinicName, doctor_name: form.fullName, access_code: accessCode })
        .select()
        .single();
      if (clinicErr) throw clinicErr;

      const { error: docErr } = await supabase.from("doctors").insert({
        user_id: userId,
        clinic_id: clinic.id,
        full_name: form.fullName,
        email: form.email,
        crm: form.crm,
      });
      if (docErr) throw docErr;

      toast.success(`Clínica criada! Código: ${accessCode}`);
      navigate({ to: "/admin/dashboard" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar clínica");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night text-white grid place-items-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-bold">S</div>
          <span className="font-display text-xl font-bold">Solaris</span>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="font-display text-2xl font-bold">Criar minha clínica</h1>
          <p className="mt-1 text-sm text-white/60">Em 30 segundos você terá um código único e o painel pronto.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {[
              { k: "fullName", label: "Seu nome completo", type: "text" },
              { k: "clinicName", label: "Nome da clínica", type: "text" },
              { k: "crm", label: "CRM (opcional)", type: "text" },
              { k: "email", label: "E-mail", type: "email" },
              { k: "password", label: "Senha", type: "password" },
            ].map((f) => (
              <div key={f.k}>
                <label className="text-xs font-medium text-white/70">{f.label}</label>
                <input
                  type={f.type}
                  required={f.k !== "crm"}
                  value={(form as any)[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar minha clínica"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-white/60">
            Já tem conta? <Link to="/auth/login" className="text-primary hover:underline">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
