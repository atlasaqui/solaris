import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { maskCPF, isValidCPF } from "@/lib/cpf";
import exclamationIcon from "@/assets/solaris/screen-05-register/exclamation_icon.png";
import scheduleIcon from "@/assets/solaris/screen-05-register/schedule_icon.png";

const schema = z.object({
  fullName: z.string().trim().min(3, "Nome muito curto").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  birthDate: z
    .string()
    .min(1, "Obrigatório")
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const age = (Date.now() - d.getTime()) / (365.25 * 864e5);
      return age >= 13 && age <= 120;
    }, "Idade mínima 13 anos"),
  cpf: z.string().refine((v) => isValidCPF(v), "CPF inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  const cpfValue = watch("cpf") ?? "";

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const clinicId = typeof window !== "undefined" ? localStorage.getItem("solaris.clinic_id") : null;
      if (!clinicId) {
        toast.error("Código da clínica não encontrado. Volte ao início.");
        navigate({ to: "/app/onboarding" });
        return;
      }
      const { data: auth, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: window.location.origin + "/app/home" },
      });
      if (error) throw error;
      const userId = auth.user?.id;
      if (!userId) throw new Error("Usuário não criado");
      const { error: pErr } = await supabase.from("patients").insert({
        user_id: userId,
        clinic_id: clinicId,
        full_name: data.fullName,
        email: data.email,
        birth_date: data.birthDate,
        cpf: data.cpf.replace(/\D/g, ""),
      } as any);
      if (pErr) throw pErr;
      toast.success("Conta criada!");
      navigate({ to: "/app/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
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
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <Field label="Nome completo" error={errors.fullName?.message}>
        <input
          {...register("fullName")}
          placeholder="Silas Freitas"
          className="w-full px-4 outline-none bg-white text-[15px]"
          style={inputStyle}
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="silasfreitas67@gmail.com"
          className="w-full px-4 outline-none bg-white text-[15px]"
          style={inputStyle}
        />
      </Field>

      <Field label="Data de nascimento" error={errors.birthDate?.message}>
        <div className="relative">
          <img
            src={scheduleIcon}
            alt=""
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none h-5 w-5 object-contain"
          />
          <input
            {...register("birthDate")}
            type="date"
            className="w-full pl-11 pr-4 outline-none bg-white text-[15px]"
            style={inputStyle}
          />
        </div>
      </Field>

      <Field label="CPF" error={errors.cpf?.message}>
        <input
          value={maskCPF(cpfValue)}
          onChange={(e) => setValue("cpf", maskCPF(e.target.value), { shouldValidate: true })}
          placeholder="000.000.000-00"
          inputMode="numeric"
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
        <div className="mt-2 flex items-center gap-1.5 text-[14px] font-normal" style={{ color: "var(--clinic-primary)" }}>
          <img src={exclamationIcon} alt="" className="h-4 w-4 object-contain" />
          <span>Mínimo 8 caracteres</span>
        </div>
      </Field>

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="text-white font-bold text-[20px] disabled:opacity-60"
          style={{
            width: 169,
            height: 45,
            background: "var(--clinic-primary)",
            borderRadius: 15,
            boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
          }}
        >
          {submitting ? "..." : "Cadastrar"}
        </button>
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
