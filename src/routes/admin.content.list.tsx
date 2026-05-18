import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  BookOpen, Plus, Eye, Heart, Bookmark, Clock, Loader2,
  Search, FileText, Video, Lightbulb, ClipboardList, MoreVertical,
  Trash2, Copy, EyeOff, Edit3, Film, TrendingUp, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content/list")({
  head: () => ({ meta: [{ title: "Minha Biblioteca" }] }),
  component: ContentListPage,
});

type Post = {
  id: string; title: string; type: string; category: string | null;
  is_published: boolean; view_count: number | null; like_count: number | null;
  cover_image_url: string | null; video_thumbnail_url: string | null;
  duration_seconds: number | null; read_time_minutes: number | null;
  published_at: string | null; created_at: string;
};

type TypeFilter = "all" | "article" | "video" | "tip" | "protocol";
type StatusFilter = "all" | "published" | "draft";
type PeriodFilter = "7d" | "30d" | "all";

const TYPE_META: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  article: { label: "Artigo", color: "bg-info/15 text-info border-info/30", icon: FileText },
  video: { label: "Vídeo", color: "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30", icon: Video },
  tip: { label: "Dica", color: "bg-success/15 text-success border-success/30", icon: Lightbulb },
  protocol: { label: "Protocolo", color: "bg-warning/15 text-warning border-warning/30", icon: ClipboardList },
};

function ContentListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [typeF, setTypeF] = useState<TypeFilter>("all");
  const [statusF, setStatusF] = useState<StatusFilter>("all");
  const [periodF, setPeriodF] = useState<PeriodFilter>("30d");
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (!doc?.clinic_id) { setLoading(false); return; }
    const { data } = await supabase.from("content_posts").select("*").eq("clinic_id", doc.clinic_id).order("created_at", { ascending: false });
    const list = (data ?? []) as Post[];
    setPosts(list);
    const ids = list.map((p) => p.id);
    if (ids.length > 0) {
      const { data: bm } = await supabase.from("content_bookmarks").select("post_id").in("post_id", ids);
      const counts: Record<string, number> = {};
      (bm ?? []).forEach((b: any) => { counts[b.post_id] = (counts[b.post_id] ?? 0) + 1; });
      setBookmarks(counts);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const periodDays = periodF === "7d" ? 7 : periodF === "30d" ? 30 : Infinity;
  const cutoff = useMemo(() => {
    if (!isFinite(periodDays)) return 0;
    return Date.now() - periodDays * 24 * 60 * 60 * 1000;
  }, [periodDays]);

  const inPeriod = (p: Post) => {
    if (!isFinite(periodDays)) return true;
    const ts = new Date(p.published_at || p.created_at).getTime();
    return ts >= cutoff;
  };

  const filtered = useMemo(() => posts.filter((p) => {
    if (!inPeriod(p)) return false;
    if (typeF !== "all" && p.type !== typeF) return false;
    if (statusF === "published" && !p.is_published) return false;
    if (statusF === "draft" && p.is_published) return false;
    if (q.trim() && !p.title.toLowerCase().includes(q.toLowerCase().trim())) return false;
    return true;
  }), [posts, typeF, statusF, q, periodDays]);

  const periodPosts = useMemo(() => posts.filter(inPeriod), [posts, periodDays]);

  const stats = useMemo(() => {
    const totalViews = periodPosts.reduce((s, p) => s + (p.view_count ?? 0), 0);
    const totalLikes = periodPosts.reduce((s, p) => s + (p.like_count ?? 0), 0);
    const totalBookmarks = periodPosts.reduce((s, p) => s + (bookmarks[p.id] ?? 0), 0);
    const reads = periodPosts.map((p) => p.read_time_minutes ?? 0).filter((n) => n > 0);
    const avgRead = reads.length > 0 ? +(reads.reduce((s, n) => s + n, 0) / reads.length).toFixed(1) : 0;
    return { totalViews, totalLikes, totalBookmarks, avgRead };
  }, [periodPosts, bookmarks]);

  const chartData = useMemo(() => {
    const days = isFinite(periodDays) ? periodDays : 30;
    const buckets: { date: string; label: string; views: number; posts: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      buckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: 0, posts: 0,
      });
    }
    const idxByDate = new Map(buckets.map((b, i) => [b.date, i]));
    periodPosts.forEach((p) => {
      const d = new Date(p.published_at || p.created_at).toISOString().slice(0, 10);
      const i = idxByDate.get(d);
      if (i != null) { buckets[i].posts += 1; buckets[i].views += p.view_count ?? 0; }
    });
    return buckets;
  }, [periodPosts, periodDays]);

  const topPosts = useMemo(
    () => [...periodPosts].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 3),
    [periodPosts],
  );

  const drafts = posts.filter((p) => !p.is_published).length;

  const togglePublish = async (p: Post) => {
    const { error } = await supabase.from("content_posts").update({
      is_published: !p.is_published,
      published_at: !p.is_published ? new Date().toISOString() : null,
    }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(p.is_published ? "Despublicado" : "Publicado");
    load();
  };

  const duplicate = async (p: Post) => {
    const { id, ...rest } = p as any;
    rest.title = `${p.title} (cópia)`;
    rest.is_published = false;
    rest.published_at = null;
    rest.slug = `${(p as any).slug ?? p.id}-copy-${Date.now()}`;
    delete rest.view_count; delete rest.like_count;
    const { data: u } = await supabase.auth.getUser();
    const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user!.id).maybeSingle();
    if (!doc?.clinic_id) return;
    rest.clinic_id = doc.clinic_id;
    const { error } = await supabase.from("content_posts").insert(rest);
    if (error) { toast.error(error.message); return; }
    toast.success("Conteúdo duplicado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este conteúdo? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("content_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído");
    load();
  };

  const typeFilters: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "Todos" }, { id: "article", label: "Artigos" },
    { id: "video", label: "Vídeos" }, { id: "tip", label: "Dicas" },
    { id: "protocol", label: "Protocolos" },
  ];
  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "Todos" }, { id: "published", label: "Publicado" }, { id: "draft", label: "Rascunho" },
  ];
  const periodFilters: { id: PeriodFilter; label: string }[] = [
    { id: "7d", label: "7 dias" }, { id: "30d", label: "30 dias" }, { id: "all", label: "Tudo" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Minha Biblioteca</h1>
            <p className="text-sm text-muted-foreground">
              {posts.length} post{posts.length === 1 ? "" : "s"} · {drafts} rascunho{drafts === 1 ? "" : "s"} · {stats.totalViews.toLocaleString("pt-BR")} views no período
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/content/new" search={{ type: "article" }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
            <Plus className="h-4 w-4" /> Novo artigo
          </Link>
          <Link to="/admin/content/video-editor"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Film className="h-4 w-4" /> Novo vídeo
          </Link>
        </div>
      </header>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Período:</span>
        {periodFilters.map((f) => (
          <button key={f.id} onClick={() => setPeriodF(f.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${periodF === f.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Mini analytics */}
      <motion.section
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total views" value={stats.totalViews.toLocaleString("pt-BR")} icon={<Eye className="h-4 w-4" />} />
        <StatCard label="Curtidas" value={stats.totalLikes.toLocaleString("pt-BR")} icon={<Heart className="h-4 w-4" />} />
        <StatCard label="Salvos" value={stats.totalBookmarks.toLocaleString("pt-BR")} icon={<Bookmark className="h-4 w-4" />} />
        <StatCard label="Leitura média" value={`${stats.avgRead} min`} icon={<Clock className="h-4 w-4" />} />
      </motion.section>

      {/* Chart + Top posts */}
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Visualizações no período</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">{chartData.length} dias</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="vw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#vw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold">Top 3 do período</h3>
          </div>
          {topPosts.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ol className="space-y-2">
              {topPosts.map((p, i) => {
                const meta = TYPE_META[p.type] ?? TYPE_META.article;
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-warning/20 text-warning" : "bg-secondary text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{p.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className={`rounded-full border px-1.5 py-0 ${meta.color}`}>{meta.label}</span>
                        <span className="inline-flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {p.view_count ?? 0}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </motion.div>
      </section>

      {/* Filters */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1">
          {typeFilters.map((f) => (
            <button key={f.id} onClick={() => setTypeF(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${typeF === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="hidden h-5 w-px bg-border lg:block" />
        <div className="flex flex-wrap gap-1">
          {statusFilters.map((f) => (
            <button key={f.id} onClick={() => setStatusF(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusF === f.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto lg:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..."
            className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
      </section>

      {/* Grid */}
      {loading ? (
        <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg font-semibold">Nada para mostrar</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou crie um novo conteúdo.</p>
        </div>
      ) : (
        <motion.div layout className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, idx) => {
              const meta = TYPE_META[p.type] ?? TYPE_META.article;
              const TypeIcon = meta.icon;
              const cover = p.video_thumbnail_url || p.cover_image_url;
              const bm = bookmarks[p.id] ?? 0;
              return (
                <motion.article
                  key={p.id} layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
                  whileHover={{ y: -2 }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md">
                  <div className="relative aspect-video w-full bg-secondary">
                    {cover ? (
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground"><TypeIcon className="h-10 w-10 opacity-40" /></div>
                    )}
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${meta.color}`}>
                      <TypeIcon className="h-3 w-3" /> {meta.label}
                    </span>
                    <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_published ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.is_published ? "✓ Publicado" : "📝 Rascunho"}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug">{p.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {p.view_count ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {p.like_count ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> {bm}</span>
                      {p.read_time_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.read_time_minutes} min</span>}
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                      <span>{(p.published_at || p.created_at) ? new Date(p.published_at || p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : ""}</span>
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpen === p.id && (
                          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                            <MenuItem icon={<Edit3 className="h-3.5 w-3.5" />} label="Editar" onClick={() => { setMenuOpen(null); toast.info("Edição em breve"); }} />
                            <MenuItem icon={p.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              label={p.is_published ? "Despublicar" : "Publicar"}
                              onClick={() => { setMenuOpen(null); togglePublish(p); }} />
                            <MenuItem icon={<Copy className="h-3.5 w-3.5" />} label="Duplicar" onClick={() => { setMenuOpen(null); duplicate(p); }} />
                            <MenuItem icon={<Trash2 className="h-3.5 w-3.5" />} label="Excluir" danger onClick={() => { setMenuOpen(null); remove(p.id); }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </motion.div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-secondary ${danger ? "text-destructive" : "text-foreground"}`}>
      {icon} {label}
    </button>
  );
}
