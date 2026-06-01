import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, MessageSquare, BarChart2, Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import infoBaloon from "@/assets/solaris/screen-16-content-library/Info_Baloon.png";

export const Route = createFileRoute("/app/content")({
  head: () => ({ meta: [{ title: "Biblioteca" }] }),
  component: Page,
});

type Post = {
  id: string; slug: string; title: string; summary: string | null;
  category: string | null; cover_image_url: string | null;
  like_count: number | null; comment_count: number | null; view_count: number | null;
};

const TABS = [
  { id: "all", label: "Cuidados" },
  { id: "novidades", label: "Novidades" },
  { id: "skincare", label: "Skincare" },
];

function Page() {
  const { brand } = useWhiteLabel();
  const [tab, setTab] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) { setLoading(false); return; }
      const { data } = await supabase.from("content_posts")
        .select("id, slug, title, summary, category, cover_image_url, like_count, comment_count, view_count")
        .eq("clinic_id", pt.clinic_id).eq("is_published", true)
        .order("published_at", { ascending: false }).limit(30);
      setPosts((data ?? []) as Post[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() =>
    tab === "all" ? posts : posts.filter((p) => (p.category ?? "").toLowerCase() === tab),
  [tab, posts]);

  return (
    <>
      <PatientHeader />
      <div className="sticky top-[72px] z-10 flex gap-6 border-b bg-white px-5">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="py-3 text-[14px] font-bold transition" style={{ color: active ? "var(--clinic-primary)" : "#9CA3AF", borderBottom: active ? "2px solid var(--clinic-primary)" : "2px solid transparent" }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-4 p-4">
        {loading ? (
          <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-[14px]" style={{ color: "var(--text-medium)" }}>Nada por aqui ainda.</div>
        ) : filtered.map((p) => (
          <Link key={p.id} to="/app/content/$slug" params={{ slug: p.slug }} className="block overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2.5 px-4 pt-3">
              <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full font-bold" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary)" }}>
                {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" /> : brand.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dark)" }}>{brand.name}</div>
            </div>
            <div className="px-4 pt-2 text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>{p.title}</div>
            {p.summary && <div className="line-clamp-2 px-4 text-[13px]" style={{ color: "var(--text-medium)" }}>{p.summary}</div>}
            {p.cover_image_url && (
              <img src={p.cover_image_url} alt="" className="mt-3 aspect-video w-full object-cover" />
            )}
            <div className="flex items-center gap-4 px-4 py-3 text-[12px]" style={{ color: "var(--text-medium)" }}>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {p.comment_count ?? 0}</span>
              <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {p.like_count ?? 0}</span>
              <span className="flex items-center gap-1"><BarChart2 className="h-4 w-4" /> {p.view_count ?? 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
