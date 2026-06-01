import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logoWhite from "@/assets/solaris/screen-01-onboarding-splash/logo-solaris-white.png";
import logo2 from "@/assets/solaris/screen02/logo-solaris.png";
import subLogo2 from "@/assets/solaris/screen02/sub-logo-solaris.png";
import headline1 from "@/assets/solaris/screen02/text-onboarding-headline-1.png";
import dots2 from "@/assets/solaris/screen02/pagination-dots.png";
import illusDigital from "@/assets/solaris/screen-03/illus-digital-clinic.png";
import headline2 from "@/assets/solaris/screen-03/text-onboarding-headline-2.png";
import dots3 from "@/assets/solaris/screen-03/pagination-dots.png";

type Step = 0 | 1;

export function OnboardingCarousel() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);

  const goRegister = () => navigate({ to: "/auth/register-patient" });
  const next = () => (step === 0 ? setStep(1) : goRegister());
  const prev = () => (step === 0 ? navigate({ to: "/app/splash" }) : setStep(0));

  if (step === 0) {
    return (
      <div className="patient-app flex h-screen flex-col items-center overflow-hidden bg-white px-8 pt-8">
        <img src={logo2} alt="Solaris" className="w-[160px]" />
        <img src={subLogo2} alt="" className="mt-2 w-[160px]" />
        <div className="flex flex-1 w-full flex-col items-center justify-center gap-6 min-h-0">
          <img src={headline1} alt="Bem-vindo" className="w-[260px] max-w-full" />
        </div>
        <img src={dots2} alt="" className="mb-4 h-3" />
        <button
          onClick={next}
          className="mb-6 w-full max-w-sm rounded-2xl py-3.5 text-[17px] font-bold text-white"
          style={{ background: "var(--clinic-primary)", boxShadow: "0px 4px 4px rgba(0,0,0,0.25)" }}
        >
          Avançar
        </button>
      </div>
    );
  }

  return (
    <div className="patient-app flex h-screen flex-col items-center overflow-hidden bg-white px-8 pt-8">
      <img
        src={logoWhite}
        alt="Solaris"
        className="w-[140px]"
        style={{ filter: "invert(35%) sepia(95%) saturate(2200%) hue-rotate(190deg) brightness(95%)" }}
      />
      <div className="flex flex-1 w-full flex-col items-center justify-center gap-6 min-h-0">
        <img src={illusDigital} alt="" className="w-[220px] max-w-full" />
        <img src={headline2} alt="" className="w-[280px] max-w-full" />
      </div>
      <img src={dots3} alt="" className="mb-4 h-3" />
      <div className="mb-6 flex w-full max-w-sm gap-3">
        <button
          onClick={prev}
          className="flex-1 rounded-2xl border-2 py-3.5 text-[15px] font-bold"
          style={{ borderColor: "var(--clinic-primary)", color: "var(--clinic-primary)" }}
        >
          Voltar
        </button>
        <button
          onClick={next}
          className="flex-1 rounded-2xl py-3.5 text-[17px] font-bold text-white"
          style={{ background: "var(--clinic-primary)", boxShadow: "0px 4px 4px rgba(0,0,0,0.25)" }}
        >
          Cadastrar
        </button>
      </div>
    </div>
  );
}
