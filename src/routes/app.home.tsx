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
type Appt = { scheduled_at: string; doctor: { full_name: string } | null };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Home() {
  const [firstName, setFirstName] = useState<string>("");
  const [featured, setFeatured] = useState<Featured | null>(null);
  const [appt, setAppt] = useState<Appt | null>(null);

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
        .select("scheduled_at, doctor:doctor_id ( full_name )")
        .eq("patient_id", pt.id)
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1);
      if (aRows && aRows.length > 0) setAppt(aRows[0] as Appt);
    })();
  }, []);

  return (
    <>
      <PatientHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        subtitle="Como está se sentindo hoje?"
      />
      <UVWidget />
      <div className="space-y-5 px-4 pt-5">
        <section>
          {appt ? (
            <NextAppointmentCard doctorName={appt.doctor?.full_name ?? "Especialista"} scheduledAt={appt.scheduled_at} />
          ) : (
            <NextAppointmentEmpty />
          )}
        </section>

        <section>
          <SectionLabel>Acesso rápido</SectionLabel>
          <QuickActionsGrid />
        </section>

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2 text-[12px] font-bold uppercase tracking-wide"
      style={{ color: "var(--text-soft)" }}
    >
      {children}
    </div>
  );
}
