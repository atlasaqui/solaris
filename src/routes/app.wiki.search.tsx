import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/wiki/search")({
  head: () => ({ meta: [{ title: "Pesquisar doenças" }] }),
  component: WikiSearch,
});

type Condition = { id: string; name: string; slug: string; category: string | null; emoji: string | null; description: string };

function WikiSearch() {
  const [items, setItems] = useState<Condition[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("wiki_conditions")
        .select("id, name, slug, category, emoji, description")
        .eq("is_published", true).order("name");
      setItems((data ?? []) as Condition[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((c) => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
  }, [items, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Condition[]>();
    filtered.forEach((c) => {
      const key = c.category ?? "Outros";
      map.set(key, [...(map.get(key) ?? []), c]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[22px] font-semibold">Pesquisar doenças</h1>
        <p className="text-[13px] text-muted-foreground">Wiki da sua clínica</p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou sintoma..."
          className="w-full rounded-full bg-white px-11 py-3 text-sm outline-none focus:ring-2"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhuma condição encontrada.
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h2>
              <div className="space-y-2">
                {list.map((c) => (
                  <Link key={c.id} to="/app/wiki/$slug" params={{ slug: c.slug }}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                      style={{ background: "var(--clinic-primary-light)" }}>{c.emoji ?? "🩺"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[14px] font-semibold">{c.name}</div>
                      <div className="line-clamp-1 text-[12px] text-muted-foreground">{c.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
