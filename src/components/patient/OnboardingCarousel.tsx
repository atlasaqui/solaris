import { useNavigate } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import doctorImg from "@/assets/solaris-doctor.png";
import logoImg from "@/assets/solaris-logo.png";
import { ClinicCodeInput } from "./ClinicCodeInput";

function Dots({ active }: { active: 0 | 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-4 w-4 rounded-full transition-all"
          style={{ background: i === active ? "var(--clinic-primary)" : "#D9D9D9" }}
        />
      ))}
    </div>
  );
}

function GoogleIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.1-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-5.1c-1.9 1.4-4.3 2.3-6.9 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6 5.1c-.4.4 6.4-4.7 6.4-14.6 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function FacebookIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="var(--clinic-primary)"
        d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z"
      />
    </svg>
  );
}

export function OnboardingCarousel() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const signInOAuth = async (provider: "google" | "facebook") => {
    try {
      if (provider === "google") {
        await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app/home" });
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "facebook",
          options: { redirectTo: window.location.origin + "/app/home" },
        });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao entrar");
    }
  };

  if (slide === 0) {
    return (
      <div className="patient-app min-h-screen bg-white flex flex-col" style={{ fontFamily: "Nunito, sans-serif" }}>
        <div className="relative h-[55vh] w-full overflow-hidden">
          <img src={doctorImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
          <img src={logoImg} alt="Solaris" className="absolute left-1/2 top-6 -translate-x-1/2 w-[160px] drop-shadow-lg" />
          <div className="absolute inset-x-6 bottom-8 text-center text-white text-[28px] font-semibold leading-tight">
            cuidar da saúde é<br />um ato de amor
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
          <div className="flex items-center gap-6">
            <button onClick={() => signInOAuth("google")} aria-label="Google" className="active:scale-95 transition">
              <GoogleIcon />
            </button>
            <button onClick={() => signInOAuth("facebook")} aria-label="Facebook" className="active:scale-95 transition">
              <FacebookIcon />
            </button>
          </div>
          <div className="flex w-full max-w-sm gap-4">
            <button
              onClick={() => setSlide(1)}
              className="flex-1 py-4 text-white text-[18px] font-bold"
              style={{ background: "var(--clinic-primary)", borderRadius: 15, boxShadow: "0px 4px 4px rgba(0,0,0,0.25)" }}
            >
              Cadastro
            </button>
            <button
              onClick={() => navigate({ to: "/auth/login" })}
              className="flex-1 py-4 text-white text-[18px] font-bold"
              style={{ background: "var(--clinic-primary)", borderRadius: 15, boxShadow: "0px 4px 4px rgba(0,0,0,0.25)" }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Slides 1, 2, 3 (apresentação, exames, código)
  return (
    <div
      className="patient-app min-h-screen bg-white flex flex-col items-center px-8 pt-16"
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      <img src={logoImg} alt="Solaris" className="w-[236px]" />

      {slide === 1 && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center">
            <HeartPulse size={148} color="#14C7BB" strokeWidth={2} />
            <p className="text-black font-semibold text-[24px] leading-snug">
              Somos a Soláris, sua plataforma de saúde digital.
            </p>
          </div>
          <Dots active={0} />
          <button onClick={() => setSlide(2)} className="text-sm font-semibold mb-4" style={{ color: "var(--clinic-primary)" }}>
            Continuar →
          </button>
        </>
      )}

      {slide === 2 && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center">
            <HeartPulse size={148} color="#43C7EB" strokeWidth={2} />
            <p className="text-black font-semibold text-[24px] leading-snug">
              Exames em um ambiente digital customizado e exclusivo para a clínica que você já confia.
            </p>
          </div>
          <Dots active={1} />
          <button onClick={() => setSlide(3)} className="text-sm font-semibold mb-4" style={{ color: "var(--clinic-primary)" }}>
            Continuar →
          </button>
        </>
      )}

      {slide === 3 && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center w-full">
            <ClinicCodeInput onValid={() => navigate({ to: "/auth/register-patient" })} />
            <p className="text-black font-semibold text-[24px] leading-snug max-w-xs">
              Para começar, insira o código fornecido pela sua clínica.
            </p>
          </div>
          <Dots active={2} />
        </>
      )}
    </div>
  );
}
