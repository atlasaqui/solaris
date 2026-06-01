import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RegisterForm } from "@/components/patient/RegisterForm";
import backIcon from "@/assets/solaris/screen-05-register/btn_icon-back.png";
import clinicIcon from "@/assets/solaris/screen-05-register/icon-clinic.png";

export const Route = createFileRoute("/auth/register-patient")({
  head: () => ({ meta: [{ title: "Cadastro — Solaris" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div
      className="patient-app flex h-screen flex-col overflow-hidden bg-white"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="relative flex items-center justify-center px-4 pt-3 pb-1 shrink-0">
        <button
          type="button"
          onClick={() => navigate({ to: "/app/onboarding" })}
          className="absolute left-3 top-2 grid h-9 w-9 place-items-center"
          aria-label="Voltar"
        >
          <img src={backIcon} alt="" className="h-full w-full object-contain" draggable={false} />
        </button>
        <img src={clinicIcon} alt="Solaris" className="h-12 w-12 object-contain" />
      </div>
      <div className="px-6 pb-1 shrink-0">
        <h1 className="text-center text-[20px] font-bold" style={{ color: "var(--clinic-primary)" }}>
          Crie sua conta
        </h1>
        <p className="mt-0.5 text-center text-[12px] text-gray-500">
          Preencha seus dados para começar
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <RegisterForm />
      </div>
    </div>
  );
}
