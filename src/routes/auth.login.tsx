import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Entrar — Solaris" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);

    // Route by role
    const userId = data.user?.id;
    if (!userId) return;
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).maybeSingle();
    navigate({ to: doctor ? "/admin/dashboard" : "/app/home" });
  };

  return (
    <div className="min-h-screen bg-night text-white grid place-items-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-bold">S</div>
          <span className="font-display text-xl font-bold">Solaris</span>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="font-display text-2xl font-bold">Entrar</h1>
          <p className="mt-1 text-sm text-white/60">Acesse sua conta de médico ou paciente.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/70">E-mail</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/70">Senha</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              disabled={loading} type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <div className="mt-6 space-y-2 text-center text-sm text-white/60">
            <div>
              Sou médico — <Link to="/auth/register-doctor" className="text-primary hover:underline">criar clínica</Link>
            </div>
            <div>
              Sou paciente — <Link to="/auth/register-patient" className="text-primary hover:underline">tenho um código</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
