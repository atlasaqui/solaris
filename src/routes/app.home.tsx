import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { UVWidget } from "@/components/patient/UVWidget";
import { QuickActionsGrid } from "@/components/patient/QuickActionsGrid";
import { FloatingChatButton } from "@/components/patient/FloatingChatButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Início" }] }),
  component: Home,
});

function Home() {
  const [featured, setFeatured] = useState<{ slug: string; title: string; cover_image_url: string | null } | null>(null);
  const [uv] = useState<number>(4);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) return;
      const { data } = await supabase.from("content_posts")
        .select("slug, title, cover_image_url")
        .eq("clinic_id", pt.clinic_id)
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setFeatured(data as any);
    })();
  }, []);

  return (
    <>
      <PatientHeader />
      <UVWidget uv={uv} />
      <div className="px-4 pt-5">
        <QuickActionsGrid />
        {featured && (
          <Link to="/app/content/$slug" params={{ slug: featured.slug }} className="mt-5 block overflow-hidden rounded-2xl">
            <div className="relative h-[140px] w-full bg-gray-200">
              {featured.cover_image_url && <img src={featured.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-3 text-white">
                <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">Destaque</div>
                <div className="text-[16px] font-bold leading-tight">{featured.title}</div>
              </div>
            </div>
          </Link>
        )}
      </div>
      <FloatingChatButton />
    </>
  );
}
