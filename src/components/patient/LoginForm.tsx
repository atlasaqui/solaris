import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import backBtn from "@/assets/solaris/screen-06-login/btn_icon-back.png";
import checkSquare from "@/assets/solaris/screen-06-login/check_square_icon.png";
import inputBar from "@/assets/solaris/screen-06-login/input_bar.png";
import btnEnter from "@/assets/solaris/screen-06-login/btn-primary-enter-code.png";

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-md space-y-5 px-5 pb-10">
      <button
        type="button"
        onClick={() => navigate({ to: "/app/splash" })}
        className="active:scale-95"
        aria-label="Voltar"
      >
        <img src={backBtn} alt="" className="h-10 w-10" />
      </button>

      <Field label="Email" error={errors.email?.message} bg={inputBar}>
        <input
          {...register("email")}
          type="email"
          placeholder="seu@email.com"
          className="absolute inset-0 m-auto h-[80%] w-[92%] bg-transparent px-3 text-[15px] outline-none"
        />
      </Field>

      <Field label="Senha" error={errors.password?.message} bg={inputBar}>
        <input
          {...register("password")}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="absolute inset-0 m-auto h-[80%] w-[92%] bg-transparent px-3 pr-10 text-[15px] outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2"
          style={{ color: "var(--clinic-primary)" }}
          aria-label="Mostrar senha"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </Field>

      <label className="flex select-none items-center gap-2 text-[15px] text-black">
        <button
          type="button"
          onClick={() => setValue("remember", !remember)}
          className="relative h-6 w-6"
          aria-pressed={!!remember}
        >
          <img src={checkSquare} alt="" className="h-full w-full" style={{ opacity: remember ? 1 : 0.35 }} />
        </button>
        Lembrar usuário
      </label>

      <div className="flex justify-center pt-2">
        <button type="submit" disabled={loading} className="active:scale-95 disabled:opacity-60" aria-label="Entrar">
          <img src={btnEnter} alt={loading ? "..." : "Entrar"} className="w-[200px]" draggable={false} />
        </button>
      </div>

      <div className="pt-2 text-center text-[15px]">
        Não tem conta?{" "}
        <Link to="/app/onboarding" className="font-semibold" style={{ color: "var(--clinic-primary)" }}>
          Cadastre-se
        </Link>
      </div>
    </form>
  );
}

function Field({ label, error, bg, children }: { label: string; error?: string; bg: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[16px] font-semibold text-black">{label}</label>
      <div className="relative w-full">
        <img src={bg} alt="" className="pointer-events-none w-full" draggable={false} />
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
