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
    <div className="patient-app min-h-screen bg-white" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="relative flex items-center justify-center px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => navigate({ to: "/app/onboarding" })}
          className="absolute left-3 top-3 grid h-10 w-10 place-items-center"
          aria-label="Voltar"
        >
          <img src={backIcon} alt="" className="h-full w-full object-contain" draggable={false} />
        </button>
        <img src={clinicIcon} alt="Solaris" className="h-14 w-14 object-contain" />
      </div>
      <div className="px-6 pb-2">
        <h1 className="text-center text-[22px] font-bold" style={{ color: "var(--clinic-primary)" }}>
          Crie sua conta
        </h1>
        <p className="mt-1 text-center text-[13px] text-gray-500">
          Preencha seus dados para começar
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
