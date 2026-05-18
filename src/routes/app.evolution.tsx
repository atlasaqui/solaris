import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/evolution")({
  head: () => ({ meta: [{ title: "Evolução" }] }),
  component: Evolution,
});

type Photo = {
  id: string; week_number: number; angle: string; storage_path: string;
  taken_at: string; doctor_comment: string | null; improvement_score: number | null;
};

function Evolution() {
  const [photos, setPhotos] = useState<(Photo & { url: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pt } = await supabase.from("patients").select("id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) { setLoading(false); return; }
      const { data } = await supabase.from("evolution_photos").select("*")
        .eq("patient_id", pt.id).order("week_number", { ascending: false });
      const rows = (data ?? []) as Photo[];
      const withUrls = await Promise.all(rows.map(async (p) => {
        const { data: signed } = await supabase.storage.from("evolution-photos").createSignedUrl(p.storage_path, 3600);
        return { ...p, url: signed?.signedUrl ?? "" };
      }));
      setPhotos(withUrls);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Sua evolução</h1>
          <p className="text-[13px] text-muted-foreground">{photos.length} foto{photos.length === 1 ? "" : "s"} registrada{photos.length === 1 ? "" : "s"}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary)" }}>
          <TrendingUp className="h-5 w-5" />
        </div>
      </header>

      {loading ? (
        <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma foto ainda. Comece registrando a foto desta semana.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {photos.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="font-display text-[14px] font-semibold">Semana {p.week_number}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(p.taken_at).toLocaleDateString("pt-BR")} · {p.angle}</div>
                </div>
                {p.improvement_score != null && (
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>
                    +{p.improvement_score}%
                  </span>
                )}
              </div>
              <div className="aspect-square bg-[#0F172A]">
                {p.url && <img src={p.url} alt={`Semana ${p.week_number}`} className="h-full w-full object-cover" />}
              </div>
              {p.doctor_comment && (
                <div className="border-t border-border bg-[#F8FAFC] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Comentário do médico</div>
                  <p className="mt-1 text-[13px] leading-relaxed">{p.doctor_comment}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
