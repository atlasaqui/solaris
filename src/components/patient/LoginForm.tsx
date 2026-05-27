import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Obrigatório"),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  const remember = watch("remember");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      const userId = res.user?.id;
      if (!userId) return;
      const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).maybeSingle();
      navigate({ to: doctor ? "/admin/dashboard" : "/app/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    border: "2px solid var(--clinic-primary)",
    borderRadius: 15,
    height: 46,
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 pb-10 space-y-4 w-full max-w-md mx-auto"
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      <Field label="Email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="seu@email.com"
          className="w-full px-4 outline-none bg-white text-[15px]"
          style={inputStyle}
        />
      </Field>

      <Field label="Senha" error={errors.password?.message}>
        <div className="relative">
          <input
            {...register("password")}
            type={show ? "text" : "password"}
            placeholder="••••••••"
            className="w-full pl-4 pr-12 outline-none bg-white text-[15px]"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--clinic-primary)" }}
            aria-label="Mostrar senha"
          >
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </Field>

      <label className="flex items-center gap-2 text-[15px] text-black select-none cursor-pointer">
        <span
          className="grid place-items-center"
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: "2px solid var(--clinic-primary)",
            background: remember ? "var(--clinic-primary)" : "transparent",
          }}
        >
          {remember && <Check size={14} color="white" strokeWidth={3} />}
        </span>
        <input
          type="checkbox"
          checked={!!remember}
          onChange={(e) => setValue("remember", e.target.checked)}
          className="sr-only"
        />
        Lembrar usuário
      </label>

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading}
          className="text-white font-bold text-[20px] disabled:opacity-60"
          style={{
            width: 169,
            height: 45,
            background: "var(--clinic-primary)",
            borderRadius: 15,
            boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
          }}
        >
          {loading ? "..." : "Entrar"}
        </button>
      </div>

      <div className="text-center text-[15px] pt-2">
        Não tem conta?{" "}
        <Link to="/app/onboarding" className="font-semibold" style={{ color: "var(--clinic-primary)" }}>
          Cadastre-se
        </Link>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[18px] font-normal text-black mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
