import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Camera, CalendarDays, LayoutGrid, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bannerPlaceholder from "@/assets/solaris/screen-10-clinic-home/clinic-banner-placeholder.png";

export const Route = createFileRoute("/app/clinic-profile")({
  head: () => ({ meta: [{ title: "Clínica" }] }),
  component: ClinicHome,
});

type Clinic = {
  name: string;
  doctor_name: string | null;
  profile_tagline: string | null;
  profile_banner_url: string | null;
  logo_url: string | null;
};

function ClinicHome() {
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) { setLoading(false); return; }
      const { data } = await supabase.from("clinics").select("name, doctor_name, profile_tagline, profile_banner_url, logo_url").eq("id", pt.clinic_id).maybeSingle();
      setClinic(data as Clinic | null);
      setLoading(false);
    })();
  }, []);

  const slides = [bannerPlaceholder, bannerPlaceholder, bannerPlaceholder];

  if (loading) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#1472D0" }} /></div>;
  }

  const clinicName = clinic?.name ?? "Sua Clínica";
  const tagline = clinic?.profile_tagline ?? "Cuidando da sua pele";

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-4" style={{ background: "#1472D0" }}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[14px] font-bold" style={{ color: "#1472D0" }}>{clinicName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold text-white leading-tight">{clinicName}</div>
            <div className="truncate text-[11px] text-white/80">{tagline}</div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Notificações"
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <Bell className="h-5 w-5 text-white" />
        </button>
      </header>

      {/* HERO BANNER */}
      <section className="relative h-[160px] w-full overflow-hidden">
        <img src={clinic?.profile_banner_url ?? bannerPlaceholder} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(14,91,170,0.85) 0%, rgba(20,114,208,0.4) 60%, rgba(20,114,208,0) 100%)" }} />
        <div className="absolute inset-y-0 left-5 flex flex-col justify-center text-white">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Bem-vindo</div>
          <div className="mt-1 text-[18px] font-bold leading-tight">Agende sua<br/>consulta hoje</div>
        </div>
        <div className="absolute bottom-3 right-3 rounded-2xl bg-white px-3 py-2 shadow-lg">
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>Clínica</div>
          <div className="text-[12px] font-bold" style={{ color: "#1472D0" }}>{clinicName}</div>
        </div>
      </section>

      {/* CAROUSEL */}
      <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl" style={{ background: "#EBF4FF", height: 160 }}>
          <img src={slides[slide]} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: "#1472D0" }} />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => setSlide((s) => (s + 1) % slides.length)}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"
          >
            <ChevronRight className="h-5 w-5" style={{ color: "#1472D0" }} />
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === slide ? 18 : 6, background: i === slide ? "#1472D0" : "#C3DCFF" }} />
          ))}
        </div>
      </section>

      {/* GRID 2x2 */}
      <section className="mx-4 mt-5 grid grid-cols-2 gap-3 pb-6">
        <ActionBtn icon={Camera} label="Analisar lesão" onClick={() => navigate({ to: "/app/lesion-camera" })} />
        <ActionBtn icon={CalendarDays} label="Agendar consulta" onClick={() => navigate({ to: "/app/schedule" })} />
        <ActionBtn icon={LayoutGrid} label="Dashboard" onClick={() => navigate({ to: "/app/home" })} />
        <ActionBtn icon={Plus} label="Mais" onClick={() => toast.info("Em breve")} />
      </section>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Camera; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-4 text-left transition active:scale-[0.98]"
      style={{ background: "#EBF4FF", borderRadius: 20, minHeight: 110 }}
    >
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white" style={{ boxShadow: "0 2px 6px rgba(20,114,208,0.15)" }}>
        <Icon className="h-5 w-5" style={{ color: "#1472D0" }} strokeWidth={2.4} />
      </div>
      <span className="text-[14px] font-bold" style={{ color: "#1E293B" }}>{label}</span>
    </button>
  );
}
