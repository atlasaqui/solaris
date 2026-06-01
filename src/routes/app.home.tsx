import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { UVWidget } from "@/components/patient/UVWidget";
import { QuickActionsGrid } from "@/components/patient/QuickActionsGrid";
import { FloatingChatButton } from "@/components/patient/FloatingChatButton";
import { NextAppointmentCard, NextAppointmentEmpty } from "@/components/patient/NextAppointmentCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Início" }] }),
  component: Home,
});

type Featured = { slug: string; title: string; cover_image_url: string | null };
type Appt = { scheduled_at: string; doctor: { full_name: string; specialty: string | null } | null };
type Analysis = { id: string; created_at: string; condition_name: string | null; probability: number | null; priority: string | null };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia 👋";
  if (h < 18) return "Boa tarde 👋";
  return "Boa noite 👋";
}

function todayLabel() {
  const d = new Date();
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Home() {
  const [firstName, setFirstName] = useState<string>("");
  const [featured, setFeatured] = useState<Featured | null>(null);
  const [appt, setAppt] = useState<Appt | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pt } = await supabase
        .from("patients")
        .select("id, clinic_id, full_name")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (!pt) return;
      setFirstName(pt.full_name?.split(" ")[0] ?? "");

      if (pt.clinic_id) {
        const { data } = await supabase
          .from("content_posts")
          .select("slug, title, cover_image_url")
          .eq("clinic_id", pt.clinic_id)
          .eq("is_published", true)
          .eq("is_featured", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) setFeatured(data as any);
      }

      const { data: aRows } = await (supabase as any)
        .from("appointments")
        .select("scheduled_at, doctor:doctor_id ( full_name, specialty )")
        .eq("patient_id", pt.id)
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1);
      if (aRows && aRows.length > 0) setAppt(aRows[0] as Appt);

      // Latest analyses
      const { data: anRows } = await (supabase as any)
        .from("lesion_analyses")
        .select("id, created_at, condition_name, probability, priority")
        .eq("patient_id", pt.id)
        .order("created_at", { ascending: false })
        .limit(2);
      if (anRows) setAnalyses(anRows as Analysis[]);
    })();
  }, []);

  return (
    <>
      <PatientHeader
        title={firstName ? `Olá, ${firstName}` : "Olá"}
        greeting={greeting()}
        dateLabel={todayLabel()}
      />
      <UVWidget />
      <div className="space-y-5 px-4 pt-5" style={{ fontFamily: "Poppins, sans-serif" }}>
        <section>
          {appt ? (
            <NextAppointmentCard
              doctorName={appt.doctor?.full_name ?? "Especialista"}
              scheduledAt={appt.scheduled_at}
              specialty={appt.doctor?.specialty ?? undefined}
            />
          ) : (
            <NextAppointmentEmpty />
          )}
        </section>

        <section>
          <SectionLabel>Acesso rápido</SectionLabel>
          <QuickActionsGrid />
        </section>

        {analyses.length > 0 && (
          <section>
            <SectionLabel>Últimas análises</SectionLabel>
            <div className="space-y-2">
              {analyses.map((a) => (
                <AnalysisRow key={a.id} a={a} />
              ))}
            </div>
          </section>
        )}

        {featured && (
          <section>
            <SectionLabel>Para você</SectionLabel>
            <Link to="/app/content/$slug" params={{ slug: featured.slug }} className="block overflow-hidden rounded-2xl">
              <div className="relative h-[140px] w-full bg-gray-200">
                {featured.cover_image_url && (
                  <img src={featured.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-4 bottom-3 text-white">
                  <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">Destaque</div>
                  <div className="text-[16px] font-bold leading-tight">{featured.title}</div>
                </div>
              </div>
            </Link>
          </section>
        )}
      </div>
      <FloatingChatButton />
    </>
  );
}

function priorityMeta(priority: string | null, probability: number | null) {
  const p = priority?.toLowerCase() ?? "";
  if (p.includes("high") || (probability ?? 0) >= 70) return { label: "Alta", color: "#EF4444", bg: "#FEF2F2" };
  if (p.includes("med") || (probability ?? 0) >= 40) return { label: "Média", color: "#F59E0B", bg: "#FFFBEB" };
  return { label: "Baixa", color: "#22C55E", bg: "#F0FDF4" };
}

function AnalysisRow({ a }: { a: Analysis }) {
  const date = new Date(a.created_at);
  const dateLabel = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const meta = priorityMeta(a.priority, a.probability);
  return (
    <Link
      to="/app/history"
      className="flex items-center justify-between rounded-2xl bg-white p-4"
      style={{ boxShadow: "0 4px 14px rgba(15,23,42,0.06)" }}
    >
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold" style={{ color: "#1A1A2E" }}>
          {a.condition_name ?? "Análise de lesão"}
        </div>
        <div className="text-[12px]" style={{ color: "#4A4A6A" }}>
          {dateLabel} {a.probability != null ? `· ${Math.round(a.probability)}%` : ""}
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
        style={{ background: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2 text-[12px] font-bold uppercase tracking-wide"
      style={{ color: "#8A8AA8" }}
    >
      {children}
    </div>
  );
}
