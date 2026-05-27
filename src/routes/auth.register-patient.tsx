import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/components/patient/RegisterForm";
import logoImg from "@/assets/solaris-logo.png";

export const Route = createFileRoute("/auth/register-patient")({
  head: () => ({ meta: [{ title: "Cadastro — Solaris" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="patient-app min-h-screen bg-white" style={{ fontFamily: "Nunito, sans-serif" }}>
      <div className="flex justify-center pt-[18px] pb-4">
        <img src={logoImg} alt="Solaris" style={{ width: 133 }} />
      </div>
      <RegisterForm />
    </div>
  );
}
