import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { supabase } from "@/integrations/supabase/client";
import { Sun } from "lucide-react";

export const Route = createFileRoute("/app/splash")({
  head: () => ({ meta: [{ title: "Solaris" }] }),
  component: Page,
});

function Page() {
  const { brand } = useWhiteLabel();
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      nav({ to: data.session ? "/app/home" : "/app/onboarding" });
    }, 2400);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="patient-app grid min-h-screen place-items-center bg-white px-6 text-center">
      <div className="animate-[scaleIn_0.8s_ease-out]">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.name} className="mx-auto h-32" />
        ) : (
          <div className="mx-auto grid h-32 w-32 place-items-center rounded-full" style={{ background: "var(--clinic-primary-light)" }}>
            <Sun className="h-16 w-16" style={{ color: "var(--clinic-primary)" }} />
          </div>
        )}
        <div className="mt-3 text-[14px]" style={{ color: "var(--clinic-primary)" }}>Clínica Digital</div>
        <div className="mt-10 text-[18px] font-bold" style={{ color: "var(--text-dark)" }}>
          A tecnologia da clínica<br />cuidando da sua pele
        </div>
      </div>
      <div className="absolute bottom-16 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--clinic-primary)", animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
      <style>{`@keyframes scaleIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
