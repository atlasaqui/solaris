import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bgSplash from "@/assets/solaris/screen-01-onboarding-splash/bg-splash.png";
import bgSplash2 from "@/assets/solaris/screen-01-onboarding-splash/bg-splash2.png";
import doctorImg from "@/assets/solaris/screen-01-onboarding-splash/bg_doctor_image.png";
import logoWhite from "@/assets/solaris/screen-01-onboarding-splash/logo-solaris-white.png";
import headline from "@/assets/solaris/screen-01-onboarding-splash/text-splash-headline.png";
import btnCadastro from "@/assets/solaris/screen-01-onboarding-splash/btn-primary-cadastro.png";
import btnLogin from "@/assets/solaris/screen-01-onboarding-splash/btn-secondary-login.png";

export const Route = createFileRoute("/app/splash")({
  head: () => ({ meta: [{ title: "Solaris" }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        nav({ to: "/app/home" });
      } else {
        setChecking(false);
      }
    })();
  }, [nav]);

  if (checking) {
    return <div className="patient-app min-h-screen bg-white" />;
  }

  return (
    <div className="patient-app relative min-h-screen overflow-hidden bg-white">
      <img src={bgSplash} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <img src={bgSplash2} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-90" />
      <img src={doctorImg} alt="" className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[62vh] w-full object-cover object-top" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <img src={logoWhite} alt="Solaris" className="absolute left-1/2 top-8 w-[170px] -translate-x-1/2 drop-shadow-lg" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-8 pb-10">
        <img src={headline} alt="cuidar da saúde é um ato de amor" className="w-[280px] max-w-full" />
        <button
          onClick={() => nav({ to: "/app/onboarding" })}
          className="active:scale-95 transition"
          aria-label="Cadastro"
        >
          <img src={btnCadastro} alt="Cadastro" className="w-[280px] max-w-[80vw]" draggable={false} />
        </button>
        <button
          onClick={() => nav({ to: "/auth/login" })}
          className="active:scale-95 transition"
          aria-label="Login"
        >
          <img src={btnLogin} alt="Login" className="w-[280px] max-w-[80vw]" draggable={false} />
        </button>
      </div>
    </div>
  );
}
