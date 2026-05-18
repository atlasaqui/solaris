import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, Loader2, MessageCircle, Image as ImageIcon, BarChart3, Send, Camera as CamIcon, Sun, Calendar, Plus, Check, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/app/evolution")({
  head: () => ({ meta: [{ title: "Acompanhamento" }] }),
  component: Evolution,
});

type Photo = {
  id: string; week_number: number; angle: string; storage_path: string;
  taken_at: string; doctor_comment: string | null; improvement_score: number | null;
};

type Comment = {
  id: string; content: string; created_at: string; doctor_id: string | null; patient_id: string | null;
};

function Evolution() {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Acompanhamento</h1>
          <p className="text-[13px] text-muted-foreground">Seu progresso, conversa e dados</p>
        </div>
        <div
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary)" }}
        >
          <TrendingUp className="h-5 w-5" />
        </div>
      </header>

      <Tabs defaultValue="photos">
        <TabsList className="w-full justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger value="photos" className="flex-1 gap-2"><ImageIcon className="h-4 w-4" /> Fotos</TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 gap-2"><MessageCircle className="h-4 w-4" /> Chat</TabsTrigger>
          <TabsTrigger value="data" className="flex-1 gap-2"><BarChart3 className="h-4 w-4" /> Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="photos"><PhotosTab /></TabsContent>
        <TabsContent value="chat"><ChatTab /></TabsContent>
        <TabsContent value="data"><DataTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------ TAB 1: PHOTOS ------------------ */
function PhotosTab() {
  const [photos, setPhotos] = useState<(Photo & { url: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) { setLoading(false); return; }
      const { data } = await supabase.from("evolution_photos").select("*")
        .eq("patient_id", pt.id).order("week_number", { ascending: true });
      const rows = (data ?? []) as Photo[];
      const withUrls = await Promise.all(rows.map(async (p) => {
        const { data: signed } = await supabase.storage.from("evolution-photos").createSignedUrl(p.storage_path, 3600);
        return { ...p, url: signed?.signedUrl ?? "" };
      }));
      setPhotos(withUrls);
      if (withUrls.length > 0) setSelected(withUrls[withUrls.length - 1].week_number);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <CamIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Comece registrando a foto desta semana.</p>
      </div>
    );
  }

  const first = photos[0];
  const current = photos.find((p) => p.week_number === selected) ?? photos[photos.length - 1];

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.week_number)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition"
            style={selected === p.week_number
              ? { background: "var(--clinic-primary)", color: "#fff" }
              : { background: "#F1F5F9", color: "#475569" }}
          >
            Semana {p.week_number}
          </button>
        ))}
      </div>

      {/* Before / After comparator */}
      <div className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-[12px] text-muted-foreground">Comparar: <b>Semana {first.week_number}</b> → <b>Semana {current.week_number}</b></div>
          {current.improvement_score != null && (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>
              +{current.improvement_score}%
            </span>
          )}
        </div>
        <div className="relative aspect-square select-none bg-[#0F172A]">
          {first.url && <img src={first.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
            {current.url && <img src={current.url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="absolute inset-y-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white text-[#0F172A] shadow-lg">
              <div className="text-[10px] font-bold">⇆</div>
            </div>
          </div>
          <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">Antes</span>
          <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">Depois</span>
        </div>
        <div className="px-4 py-3">
          <input
            type="range" min={0} max={100} value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-full accent-[var(--clinic-primary)]"
          />
        </div>
        {current.doctor_comment && (
          <div className="border-t border-border bg-[#F8FAFC] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Comentário do médico</div>
            <p className="mt-1 text-[13px] leading-relaxed">{current.doctor_comment}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------ TAB 2: CHAT ------------------ */
function ChatTab() {
  const [messages, setMessages] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async (ptId: string) => {
    const { data } = await supabase.from("clinical_comments")
      .select("id, content, created_at, doctor_id, patient_id")
      .eq("patient_id", ptId).order("created_at", { ascending: true });
    setMessages((data ?? []) as Comment[]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) { setLoading(false); return; }
      setPatientId(pt.id);
      setClinicId(pt.clinic_id);
      await load(pt.id);
      setLoading(false);
    })();
  }, []);

  const send = async () => {
    const body = text.trim();
    if (!body || !patientId || sending) return;
    setSending(true);
    const { error } = await supabase.from("clinical_comments").insert({
      patient_id: patientId,
      content: body,
      is_visible_to_patient: true,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    await load(patientId);
  };

  if (loading) return <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
            <div>
              <MessageCircle className="mx-auto h-8 w-8" />
              <p className="mt-2">Nenhuma mensagem ainda.</p>
            </div>
          </div>
        ) : messages.map((m) => {
          const fromDoctor = !!m.doctor_id;
          return (
            <div key={m.id} className={`flex ${fromDoctor ? "justify-start" : "justify-end"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed"
                style={fromDoctor
                  ? { background: "#fff", color: "#0F172A", border: "1px solid #E2E8F0" }
                  : { background: "var(--clinic-primary)", color: "#fff" }}
              >
                <div>{m.content}</div>
                <div className={`mt-1 text-[10px] ${fromDoctor ? "text-muted-foreground" : "text-white/70"}`}>
                  {new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escreva uma mensagem..."
          className="flex-1 rounded-full border border-border bg-[#F8FAFC] px-4 py-2 text-[13px] outline-none focus:border-[var(--clinic-primary)]"
        />
        <button
          onClick={send}
          className="grid h-10 w-10 place-items-center rounded-full text-white"
          style={{ background: "var(--clinic-primary)" }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------ TAB 3: DATA ------------------ */
function DataTab() {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uvAvg, setUvAvg] = useState<number>(0);
  const [treatmentTotal, setTreatmentTotal] = useState<number>(0);
  const [treatmentCurrent, setTreatmentCurrent] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) { setLoading(false); return; }
      const [photosR, uvR, tR] = await Promise.all([
        supabase.from("evolution_photos").select("*").eq("patient_id", pt.id).order("week_number", { ascending: true }),
        supabase.from("uv_protection_logs").select("uv_index").eq("patient_id", pt.id),
        supabase.from("treatments").select("total_weeks, current_week").eq("patient_id", pt.id).eq("status", "active").maybeSingle(),
      ]);
      setPhotos((photosR.data ?? []) as Photo[]);
      const uvs = (uvR.data ?? []).map((x: any) => Number(x.uv_index ?? 0));
      setUvAvg(uvs.length ? +(uvs.reduce((a, b) => a + b, 0) / uvs.length).toFixed(1) : 0);
      setTreatmentTotal(tR.data?.total_weeks ?? 0);
      setTreatmentCurrent(tR.data?.current_week ?? 0);
      setLoading(false);
    })();
  }, []);

  const chartData = useMemo(
    () => photos
      .filter((p) => p.improvement_score != null)
      .map((p) => ({ week: `S${p.week_number}`, score: Number(p.improvement_score) })),
    [photos],
  );

  const totalPhotos = photos.length;
  const adherence = treatmentCurrent > 0 ? Math.min(100, Math.round((totalPhotos / treatmentCurrent) * 100)) : 0;
  const remaining = Math.max(0, treatmentTotal - treatmentCurrent);

  if (loading) return <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-[14px] font-semibold">Evolução de melhora</h3>
          <span className="text-[11px] text-muted-foreground">% por semana</span>
        </div>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="var(--clinic-primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--clinic-primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={CamIcon} label="Fotos enviadas" value={String(totalPhotos)} />
        <StatCard icon={TrendingUp} label="Adesão" value={`${adherence}%`} />
        <StatCard icon={Sun} label="UV médio" value={String(uvAvg)} />
        <StatCard icon={Calendar} label="Semanas restantes" value={String(remaining)} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof CamIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <Icon className="h-5 w-5" style={{ color: "var(--clinic-primary)" }} />
      <div className="mt-2 font-display text-[22px] font-bold">{value}</div>
      <div className="text-[12px] text-muted-foreground">{label}</div>
    </div>
  );
}
