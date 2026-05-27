import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/patient/LoginForm";
import logoImg from "@/assets/solaris-logo.png";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Entrar — Solaris" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="patient-app min-h-screen bg-white" style={{ fontFamily: "Nunito, sans-serif" }}>
      <div className="flex justify-center pt-6 pb-4">
        <img src={logoImg} alt="Solaris" style={{ width: 133 }} />
      </div>
      <LoginForm />
    </div>
  );
}
