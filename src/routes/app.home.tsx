import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, BookOpen, Building2, TrendingUp, Search, ArrowRight, Loader2 } from "lucide-react";
import { fetchUV, uvLevel, type UVData } from "@/lib/uv";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Início" }] }),
  component: Home,
});

function Home() {
  const { brand } = useWhiteLabel();
  const [uvData, setUvData] = useState<UVData | null>(null);
  const [loadingUv, setLoadingUv] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchUV()
      .then(setUvData)
      .catch(() => setUvData({ uvIndex: 0, temperature: 0, city: "—", lat: 0, lng: 0 }))
      .finally(() => setLoadingUv(false));
  }, []);

  const uv = uvLevel(uvData?.uvIndex ?? 0);

  const registerProtection = async () => {
    if (!uvData) return;
    setRegistering(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: p } = await supabase
      .from("patients")
      .select("id, clinic_id")
      .eq("user_id", u.user?.id ?? "")
      .maybeSingle();
    if (!p) { setRegistering(false); toast.error("Paciente não vinculado"); return; }
    const { error } = await supabase.from("uv_protection_logs").insert({
      patient_id: p.id,
      clinic_id: p.clinic_id,
      uv_index: uvData.uvIndex,
      temperature: uvData.temperature,
      city: uvData.city,
      lat: uvData.lat,
      lng: uvData.lng,
    });
    setRegistering(false);
    if (error) toast.error("Erro ao registrar");
    else toast.success("Proteção registrada ✓");
  };

  return (
    <div className="space-y-6">
      {/* HERO — Widget UV */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{
          background:
            "linear-gradient(160deg, var(--clinic-primary-dark) 0%, var(--clinic-primary) 100%)",
          boxShadow: "0 12px 32px -8px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />

        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/70">
          <span>Índice UV agora</span>
          <span>📍 {UV_CITY}</span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[64px] font-bold leading-none tracking-tight">
              {UV_INDEX}
            </span>
            <div className="pb-2">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: uv.color, color: "#fff" }}
              >
                {uv.label}
              </span>
              <div className="mt-1 text-sm text-white/75">{UV_TEMP}° agora</div>
            </div>
          </div>
        </div>

        {/* Risk gradient bar */}
        <div className="mt-6">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${uv.pct}%`,
                background:
                  "linear-gradient(90deg, #16A34A 0%, #EAB308 40%, #F97316 70%, #EF4444 100%)",
                boxShadow: `0 0 12px ${uv.color}80`,
                transition: "width 600ms ease",
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/60">
            <span>Baixo</span>
            <span>Moderado</span>
            <span>Alto</span>
            <span>Extremo</span>
          </div>
        </div>

        <button
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
        >
          Registrar proteção solar
        </button>
      </section>

      {/* Foto da semana */}
      <section
        className="rounded-3xl bg-white p-5"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
            style={{ background: "var(--clinic-primary-light)" }}
          >
            <Camera className="h-6 w-6" style={{ color: "var(--clinic-primary)" }} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-semibold text-foreground">
              Foto desta semana
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">Semana 4 de 8</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full"
              style={{
                width: "50%",
                background:
                  "linear-gradient(90deg, var(--clinic-primary), var(--clinic-primary-dark))",
              }}
            />
          </div>
        </div>

        <Link
          to="/app/camera"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--clinic-primary)" }}
        >
          Registrar agora
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Atalhos */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-[18px] font-semibold">Atalhos</h2>
          <span className="text-[13px] text-muted-foreground">Acesso rápido</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/app/wiki/search", icon: Search, label: "Pesquisar" },
            { to: "/app/evolution", icon: TrendingUp, label: "Evolução" },
            { to: "/app/content/feed", icon: BookOpen, label: "Biblioteca" },
            { to: "/app/clinic-profile", icon: Building2, label: "Clínica" },
          ].map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-[#F8FAFC] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
            >
              <s.icon
                className="h-8 w-8 transition-transform group-hover:scale-110"
                style={{ color: "var(--clinic-primary)" }}
                strokeWidth={1.75}
              />
              <span className="text-[12px] font-medium text-foreground">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
