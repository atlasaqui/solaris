import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, Loader2, ChevronRight, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/patients")({
  head: () => ({ meta: [{ title: "Pacientes" }] }),
  component: PatientsList,
});

type PatientRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  city: string | null;
  status: string | null;
  created_at: string;
  photo_count: number;
  last_photo_at: string | null;
};

function PatientsList() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: pts } = await supabase.from("patients")
        .select("id, full_name, email, avatar_url, city, status, created_at")
        .order("created_at", { ascending: false });
      const list = pts ?? [];
      const ids = list.map((p) => p.id);
      let counts: Record<string, { c: number; last: string | null }> = {};
      if (ids.length > 0) {
        const { data: ph } = await supabase.from("evolution_photos")
          .select("patient_id, taken_at").in("patient_id", ids);
        (ph ?? []).forEach((p: any) => {
          const k = p.patient_id as string;
          if (!counts[k]) counts[k] = { c: 0, last: null };
          counts[k].c += 1;
          if (!counts[k].last || (p.taken_at && p.taken_at > counts[k].last!)) counts[k].last = p.taken_at;
        });
      }
      setRows(list.map((p) => ({
        ...p,
        photo_count: counts[p.id]?.c ?? 0,
        last_photo_at: counts[p.id]?.last ?? null,
      })) as PatientRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return r.full_name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "paciente" : "pacientes"} no total</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full rounded-xl border border-border bg-card px-10 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {filtered.map((p, i) => (
            <Link
              key={p.id}
              to="/admin/patients/$id"
              params={{ id: p.id }}
              className={`flex items-center gap-4 p-4 transition hover:bg-secondary ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : p.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.email}{p.city ? ` · ${p.city}` : ""}</div>
              </div>
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Camera className="h-3.5 w-3.5" /> {p.photo_count}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
