import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Loader2, Mail, MapPin, Phone, Calendar, Hash, ShieldCheck,
  Camera, LineChart as LineIcon, NotebookPen, User as UserIcon,
  Eye, EyeOff, Save, Archive, MessageCircle, Check, Sparkles, Send,
  Plus, Trash2, X,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { analyzePhoto, saveDoctorFeedback } from "@/lib/clinical.functions";
import { PROGRESS_LEVEL_META, type ProgressLevel } from "@/lib/gamification";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/patients/$id")({
  head: () => ({ meta: [{ title: "Ficha clínica" }] }),
  component: PatientDetail,
});

type Patient = {
  id: string; full_name: string; email: string; phone: string | null;
  avatar_url: string | null; city: string | null; state: string | null;
  birth_date: string | null; created_at: string; status: string | null;
  clinic_id: string | null;
};
type Photo = {
  id: string; week_number: number; angle: string; storage_path: string;
  taken_at: string; doctor_comment: string | null; improvement_score: number | null;
  reviewed_at: string | null;
};
type Comment = {
  id: string; content: string; created_at: string;
  doctor_id: string | null; patient_id: string | null;
  photo_id: string | null; is_visible_to_patient: boolean | null;
};
type Treatment = {
  id: string; condition_name: string; protocol: string | null;
  started_at: string; total_weeks: number; current_week: number | null;
  status: string | null; doctor_id: string | null;
};
type Clinic = { id: string; name: string; access_code: string; doctor_name: string };

function ageFrom(birth: string | null) {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

function monthsSince(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function PatientDetail() {
  const { id } = Route.useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [photos, setPhotos] = useState<(Photo & { url: string })[]>([]);
  const [uvLogs, setUvLogs] = useState<{ uv_index: number | null; registered_at: string }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: p } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, avatar_url, city, state, birth_date, created_at, status, clinic_id")
      .eq("id", id).maybeSingle();
    setPatient(p as Patient | null);
    if (!p) { setLoading(false); return; }

    const [{ data: t }, { data: c }, { data: ph }, { data: msg }, { data: uv }] = await Promise.all([
      supabase.from("treatments").select("*").eq("patient_id", id).order("started_at", { ascending: false }).limit(1).maybeSingle(),
      p.clinic_id ? supabase.from("clinics").select("id, name, access_code, doctor_name").eq("id", p.clinic_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("evolution_photos").select("*").eq("patient_id", id).order("week_number", { ascending: true }),
      supabase.from("clinical_comments").select("id, content, created_at, doctor_id, patient_id, photo_id, is_visible_to_patient").eq("patient_id", id).order("created_at", { ascending: true }),
      supabase.from("uv_protection_logs").select("uv_index, registered_at").eq("patient_id", id).order("registered_at", { ascending: true }),
    ]);
    setTreatment(t as Treatment | null);
    setClinic(c as Clinic | null);
    setComments((msg ?? []) as Comment[]);
    setUvLogs((uv ?? []) as any);
    const rows = (ph ?? []) as Photo[];
    const withUrls = await Promise.all(rows.map(async (r) => {
      const { data: signed } = await supabase.storage.from("evolution-photos").createSignedUrl(r.storage_path, 3600);
      return { ...r, url: signed?.signedUrl ?? "" };
    }));
    setPhotos(withUrls);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!patient) return <div className="text-sm text-muted-foreground">Paciente não encontrado.</div>;

  const age = ageFrom(patient.birth_date);
  const months = monthsSince(patient.created_at);
  const totalWeeks = treatment?.total_weeks ?? 0;
  const currentWeek = treatment?.current_week ?? 0;
  const progressPct = totalWeeks > 0 ? Math.min(100, Math.round((currentWeek / totalWeeks) * 100)) : 0;

  const photosByWeek = new Map<number, (Photo & { url: string })[]>();
  photos.forEach((p) => {
    const k = p.week_number;
    if (!photosByWeek.has(k)) photosByWeek.set(k, []);
    photosByWeek.get(k)!.push(p);
  });

  return (
    <div className="space-y-6">
      <Link to="/admin/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT — Identity */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {patient.avatar_url ? <img src={patient.avatar_url} alt="" className="h-full w-full object-cover" /> : patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pt-1">
                <h1 className="font-display text-[22px] font-bold leading-tight">{patient.full_name}</h1>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${patient.status === "active" ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${patient.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                    {patient.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-2 text-[13px]">
              {age != null && (
                <Row icon={<Calendar className="h-3.5 w-3.5" />}>
                  <strong>{age} anos</strong>
                  {patient.birth_date && <span className="text-muted-foreground"> · Nasc. {new Date(patient.birth_date).toLocaleDateString("pt-BR")}</span>}
                </Row>
              )}
              {(patient.city || patient.state) && (
                <Row icon={<MapPin className="h-3.5 w-3.5" />}>{patient.city}{patient.state ? `, ${patient.state}` : ""}</Row>
              )}
              <Row icon={<Mail className="h-3.5 w-3.5" />}>{patient.email}</Row>
              {patient.phone && <Row icon={<Phone className="h-3.5 w-3.5" />}>{patient.phone}</Row>}
              <Row icon={<UserIcon className="h-3.5 w-3.5" />}>
                Paciente desde {new Date(patient.created_at).toLocaleDateString("pt-BR")} <span className="text-muted-foreground">(há {months || "<1"} {months === 1 ? "mês" : "meses"})</span>
              </Row>
              {clinic && (
                <Row icon={<Hash className="h-3.5 w-3.5" />}>
                  Código: <span className="font-mono">{clinic.access_code}</span>
                </Row>
              )}
            </dl>
          </section>

          {treatment ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Tratamento atual
              </div>
              <h3 className="font-display text-base font-semibold">{treatment.condition_name}</h3>
              {treatment.protocol && <p className="mt-1 text-[13px] text-muted-foreground">{treatment.protocol}</p>}
              <div className="mt-3 space-y-1 text-[12px] text-muted-foreground">
                <div>Início: <span className="text-foreground">{new Date(treatment.started_at).toLocaleDateString("pt-BR")}</span></div>
                <div>Progresso: <span className="text-foreground">Semana {currentWeek} de {totalWeeks}</span></div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              {clinic && <div className="mt-3 text-[12px] text-muted-foreground">Médico: <span className="text-foreground">{clinic.doctor_name}</span></div>}
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              Nenhum tratamento ativo registrado.
            </section>
          )}

          {totalWeeks > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Linha do tempo</div>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: totalWeeks }).map((_, i) => {
                  const w = i + 1;
                  const arr = photosByWeek.get(w) ?? [];
                  const has = arr.length > 0;
                  const reviewed = has && arr.some((p) => !!p.reviewed_at);
                  const isFuture = w > currentWeek;
                  const isMissed = !has && !isFuture && w < currentWeek;
                  const state = reviewed ? "ok" : has ? "pending" : isFuture ? "future" : isMissed ? "missed" : "future";
                  const cls = state === "ok" ? "bg-success/15 text-success border-success/40"
                    : state === "pending" ? "bg-primary/10 text-primary border-primary/40"
                    : state === "missed" ? "bg-destructive/10 text-destructive border-destructive/40"
                    : "bg-muted/50 text-muted-foreground border-border";
                  const ic = state === "ok" ? "✓" : state === "missed" ? "✗" : state === "pending" ? "◐" : "·";
                  return (
                    <div key={w} title={`Semana ${w}`}
                      className={`flex h-10 flex-col items-center justify-center rounded-md border text-[10px] font-semibold ${cls}`}>
                      <span>S{w}</span><span className="text-[11px] leading-none">{ic}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>

        {/* RIGHT — Tabs */}
        <div>
          <Tabs defaultValue="evolution">
            <TabsList className="h-auto w-full justify-start gap-1 bg-muted/60 p-1">
              <TabsTrigger value="evolution" className="gap-2 px-3 py-2"><Camera className="h-4 w-4" /> Evolução</TabsTrigger>
              <TabsTrigger value="charts" className="gap-2 px-3 py-2"><LineIcon className="h-4 w-4" /> Gráficos</TabsTrigger>
              <TabsTrigger value="notes" className="gap-2 px-3 py-2"><NotebookPen className="h-4 w-4" /> Notas</TabsTrigger>
              <TabsTrigger value="personal" className="gap-2 px-3 py-2"><UserIcon className="h-4 w-4" /> Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="evolution" className="space-y-4">
              <EvolutionTab photos={photos} onSaved={load} />
            </TabsContent>
            <TabsContent value="charts">
              <ChartsTab photos={photos} uvLogs={uvLogs} totalWeeks={totalWeeks} />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab patientId={id} comments={comments} onChange={load} />
            </TabsContent>
            <TabsContent value="personal">
              <PersonalTab patient={patient} onSaved={load} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

/* -------------------- TAB 1 — EVOLUTION -------------------- */
function EvolutionTab({ photos, onSaved }: { photos: (Photo & { url: string })[]; onSaved: () => void }) {
  const byWeek = useMemo(() => {
    const m = new Map<number, (Photo & { url: string })[]>();
    photos.forEach((p) => { if (!m.has(p.week_number)) m.set(p.week_number, []); m.get(p.week_number)!.push(p); });
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [photos]);

  const first = byWeek[0]?.[1]?.[0];
  const last = byWeek[byWeek.length - 1]?.[1]?.[0];
  const [slider, setSlider] = useState(50);

  if (photos.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Nenhuma foto enviada ainda.</div>;
  }

  return (
    <div className="space-y-6">
      {first && last && first.id !== last.id && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 text-[12px] text-muted-foreground">
            <span>Semana {first.week_number}</span><span>Semana {last.week_number}</span>
          </div>
          <div className="relative h-[420px] select-none bg-[#0F172A]">
            <img src={first.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${slider}%)` }}>
              <img src={last.url} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-y-0 w-0.5 bg-white shadow-lg" style={{ left: `${slider}%` }} />
            <input type="range" min={0} max={100} value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0" />
          </div>
        </section>
      )}

      {byWeek.map(([w, arr]) => (
        <WeekBlock key={w} week={w} photos={arr} onSaved={onSaved} />
      ))}
    </div>
  );
}

type AIAnalysis = {
  pigmentation_delta_pct: number;
  area_delta_pct: number;
  uniformity_delta_pct: number;
  improvement_score: number;
  classification: ProgressLevel;
  suggestion: string;
};

type FeedbackRow = {
  id: string; photo_id: string | null; progress_level: ProgressLevel;
  message: string | null; next_steps: any; include_ai_analysis: boolean;
  status: string; sent_at: string | null;
};

const LEVEL_KEYS: ProgressLevel[] = ["none", "mild", "moderate", "great", "excellent"];

function WeekBlock({ week, photos, onSaved }: { week: number; photos: (Photo & { url: string })[]; onSaved: () => void }) {
  const lead = photos[0];
  const patientId = (lead as any).patient_id as string;
  const treatmentId = ((lead as any).treatment_id ?? null) as string | null;

  const runAnalyze = useServerFn(analyzePhoto);
  const runSaveFeedback = useServerFn(saveDoctorFeedback);

  const [ai, setAi] = useState<AIAnalysis | null>(((lead as any).ai_analysis as AIAnalysis | null) ?? null);
  const [aiSuggestion, setAiSuggestion] = useState<string>(ai?.suggestion ?? "");
  const [analyzing, setAnalyzing] = useState(false);

  const [fb, setFb] = useState<FeedbackRow | null>(null);
  const [level, setLevel] = useState<ProgressLevel>("moderate");
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState<{ text: string; done: boolean }[]>([]);
  const [newStep, setNewStep] = useState("");
  const [includeAi, setIncludeAi] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("doctor_feedback")
        .select("id, photo_id, progress_level, message, next_steps, include_ai_analysis, status, sent_at")
        .eq("photo_id", lead.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const r = data as FeedbackRow;
        setFb(r);
        setLevel(r.progress_level);
        setMessage(r.message ?? "");
        setSteps(Array.isArray(r.next_steps) ? r.next_steps : []);
        setIncludeAi(r.include_ai_analysis);
      }
    })();
  }, [lead.id]);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const result = (await runAnalyze({ data: { photoId: lead.id } })) as AIAnalysis;
      setAi(result);
      setAiSuggestion(result.suggestion);
      setLevel(result.classification);
      toast.success("Análise concluída");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao analisar");
    } finally {
      setAnalyzing(false);
    }
  };

  const persistSuggestion = async () => {
    if (!ai) return;
    const next = { ...ai, suggestion: aiSuggestion };
    await supabase.from("evolution_photos").update({ ai_analysis: next as any }).eq("id", lead.id);
    setAi(next);
    toast.success("Sugestão salva");
  };

  const doSave = async (send: boolean) => {
    if (send) setSending(true); else setSavingDraft(true);
    try {
      const res = await runSaveFeedback({
        data: {
          id: fb?.id,
          photoId: lead.id,
          patientId,
          treatmentId,
          weekNumber: week,
          progressLevel: level,
          message,
          nextSteps: steps,
          includeAiAnalysis: includeAi,
          send,
        },
      });
      setFb((prev) => ({ ...(prev ?? {} as FeedbackRow), id: (res as any).id, status: (res as any).status } as FeedbackRow));
      toast.success(send ? "Avaliação enviada ao paciente" : "Rascunho salvo");
      if (send) onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar");
    } finally {
      setSending(false); setSavingDraft(false);
    }
  };

  const addStep = () => {
    const t = newStep.trim(); if (!t) return;
    setSteps([...steps, { text: t, done: false }]); setNewStep("");
  };

  const levelMeta = PROGRESS_LEVEL_META[level];
  const sent = fb?.status === "sent";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card" style={{ borderLeft: `4px solid ${levelMeta.color}` }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Semana {week}</span>
          <span className="text-xs text-muted-foreground">{photos.length} foto{photos.length === 1 ? "" : "s"}</span>
          {sent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-semibold text-success">
              <Check className="h-3 w-3" /> Enviado
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-border bg-[#0F172A]">
            <div className="aspect-square w-full">
              {p.url && <img src={p.url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground">
              <span className="capitalize">{p.angle.replace("_", " ")}</span>
              {p.reviewed_at && <Check className="h-3 w-3 text-success" />}
            </div>
          </div>
        ))}
      </div>

      {/* Solaris IA */}
      <div className="border-t border-border bg-gradient-to-br from-primary/[0.04] to-transparent p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h4 className="font-display text-sm font-semibold">Análise Solaris IA</h4>
          </div>
          <button onClick={analyze} disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-60">
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {ai ? "Reanalisar" : "Analisar com IA"}
          </button>
        </div>

        {!ai ? (
          <p className="text-xs text-muted-foreground">A IA compara esta foto com a semana 1 e sugere uma classificação clínica auxiliar.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Metric label="Pigmentação" value={ai.pigmentation_delta_pct} positiveIsBad />
              <Metric label="Área afetada" value={ai.area_delta_pct} positiveIsBad />
              <Metric label="Uniformidade" value={ai.uniformity_delta_pct} positiveIsBad={false} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Classificação sugerida:</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold"
                style={{ background: `${PROGRESS_LEVEL_META[ai.classification].color}20`, color: PROGRESS_LEVEL_META[ai.classification].color }}>
                {PROGRESS_LEVEL_META[ai.classification].emoji} {PROGRESS_LEVEL_META[ai.classification].label}
              </span>
              <span className="ml-auto text-muted-foreground">Score: <strong className="text-foreground">{Math.round(ai.improvement_score)}</strong></span>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sugestão clínica (editável)</label>
              <textarea value={aiSuggestion} onChange={(e) => setAiSuggestion(e.target.value)} rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={persistSuggestion}
                className="mt-1.5 text-[11px] font-semibold text-primary hover:underline">Salvar sugestão</button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback do médico */}
      <div className="space-y-4 border-t border-border p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
            <NotebookPen className="h-3.5 w-3.5" />
          </div>
          <h4 className="font-display text-sm font-semibold">Feedback do médico</h4>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nível de progresso</label>
          <div className="flex flex-wrap gap-1.5">
            {LEVEL_KEYS.map((k) => {
              const m = PROGRESS_LEVEL_META[k];
              const active = level === k;
              return (
                <button key={k} onClick={() => setLevel(k)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-transparent text-white shadow-sm" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}
                  style={active ? { background: m.color } : {}}>
                  <span>{m.emoji}</span> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mensagem para o paciente</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            placeholder="Ex: A pigmentação reduziu bem. Continue o protocolo e mantenha hidratação..."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Próximos passos</label>
          <div className="space-y-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
                <button onClick={() => { const c = [...steps]; c[i] = { ...c[i], done: !c[i].done }; setSteps(c); }}
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${s.done ? "border-success bg-success text-white" : "border-border"}`}>
                  {s.done && <Check className="h-3 w-3" />}
                </button>
                <span className={`flex-1 text-sm ${s.done ? "text-muted-foreground line-through" : ""}`}>{s.text}</span>
                <button onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newStep} onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }}
                placeholder="Adicionar passo..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary" />
              <button onClick={addStep} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>
        </div>

        <button onClick={() => setIncludeAi((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${includeAi ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {includeAi ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {includeAi ? "Incluir análise da IA para o paciente" : "Ocultar análise da IA do paciente"}
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <button onClick={() => doSave(false)} disabled={savingDraft || sending}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar rascunho
          </button>
          <button onClick={() => doSave(true)} disabled={sending || savingDraft}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar para paciente
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, positiveIsBad }: { label: string; value: number; positiveIsBad: boolean }) {
  const improvement = positiveIsBad ? value < 0 : value > 0;
  const color = value === 0 ? "#94A3B8" : improvement ? "#10B981" : "#EF4444";
  const pct = Math.min(100, Math.abs(value));
  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span style={{ color }}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* -------------------- TAB 2 — CHARTS -------------------- */
function ChartsTab({
  photos, uvLogs, totalWeeks,
}: {
  photos: Photo[];
  uvLogs: { uv_index: number | null; registered_at: string }[];
  totalWeeks: number;
}) {
  const improvement = useMemo(() => {
    const m = new Map<number, number[]>();
    photos.forEach((p) => {
      if (p.improvement_score == null) return;
      if (!m.has(p.week_number)) m.set(p.week_number, []);
      m.get(p.week_number)!.push(Number(p.improvement_score));
    });
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0])
      .map(([w, arr]) => ({ week: `S${w}`, score: +(arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(1) }));
  }, [photos]);

  const uvByWeek = useMemo(() => {
    if (uvLogs.length === 0) return [];
    const first = new Date(uvLogs[0].registered_at).getTime();
    const m = new Map<number, number[]>();
    uvLogs.forEach((l) => {
      if (l.uv_index == null) return;
      const days = Math.floor((new Date(l.registered_at).getTime() - first) / (1000 * 60 * 60 * 24));
      const w = Math.floor(days / 7) + 1;
      if (!m.has(w)) m.set(w, []);
      m.get(w)!.push(Number(l.uv_index));
    });
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0])
      .map(([w, arr]) => ({ week: `S${w}`, uv: +(arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(1) }));
  }, [uvLogs]);

  const adherence = useMemo(() => {
    const submitted = new Set(photos.map((p) => p.week_number));
    const rows: { week: string; pct: number }[] = [];
    const max = Math.max(totalWeeks, photos.length > 0 ? Math.max(...photos.map((p) => p.week_number)) : 0);
    for (let w = 1; w <= max; w++) rows.push({ week: `S${w}`, pct: submitted.has(w) ? 100 : 0 });
    return rows;
  }, [photos, totalWeeks]);

  return (
    <div className="space-y-4">
      <ChartCard title="Evolução de melhora (%)">
        {improvement.length === 0 ? <Empty msg="Sem pontuações registradas ainda." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={improvement} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Índice UV médio por semana">
        {uvByWeek.length === 0 ? <Empty msg="Sem registros de UV ainda." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={uvByWeek} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="uv" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Adesão semanal (fotos enviadas)">
        {adherence.length === 0 ? <Empty msg="Aguardando início do tratamento." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={adherence} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="adh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="pct" stroke="#16a34a" strokeWidth={2} fill="url(#adh)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-2 font-display text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="grid h-[180px] place-items-center text-xs text-muted-foreground">{msg}</div>;
}

/* -------------------- TAB 3 — NOTES -------------------- */
function NotesTab({ patientId, comments, onChange }: { patientId: string; comments: Comment[]; onChange: () => void }) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments.length]);

  const save = async () => {
    const body = text.trim();
    if (!body || saving) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: doc } = await supabase.from("doctors").select("id").eq("user_id", u.user!.id).maybeSingle();
    const { error } = await supabase.from("clinical_comments").insert({
      patient_id: patientId,
      doctor_id: doc?.id,
      content: body,
      is_visible_to_patient: visible,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    onChange();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card">
        <div className="max-h-[420px] space-y-4 overflow-y-auto p-5">
          {comments.length === 0 ? (
            <div className="grid h-32 place-items-center text-center text-sm text-muted-foreground">
              <div><MessageCircle className="mx-auto h-6 w-6" /><p className="mt-2">Nenhuma nota registrada.</p></div>
            </div>
          ) : comments.map((c) => {
            const fromDoctor = !!c.doctor_id;
            return (
              <div key={c.id} className="flex gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${fromDoctor ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {fromDoctor ? "Dr" : "P"}
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-background p-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>{new Date(c.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="inline-flex items-center gap-1">
                      {c.photo_id && <Camera className="h-3 w-3" />}
                      {c.is_visible_to_patient ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="space-y-3 border-t border-border p-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
            placeholder="Adicionar nota clínica..."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setVisible((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${visible ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"}`}>
              {visible ? <><Eye className="h-3.5 w-3.5" /> Visível para o paciente</> : <><EyeOff className="h-3.5 w-3.5" /> Apenas para o médico</>}
            </button>
            <button onClick={save} disabled={saving || !text.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar nota
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------- TAB 4 — PERSONAL -------------------- */
function PersonalTab({ patient, onSaved }: { patient: Patient; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: patient.full_name, email: patient.email,
    phone: patient.phone ?? "", birth_date: patient.birth_date ?? "",
    city: patient.city ?? "", state: patient.state ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("patients").update({
      full_name: form.full_name, email: form.email,
      phone: form.phone || null, birth_date: form.birth_date || null,
      city: form.city || null, state: form.state || null,
    }).eq("id", patient.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados atualizados");
    onSaved();
  };

  const archive = async () => {
    if (!confirm("Arquivar este paciente? Ele ficará inativo.")) return;
    const { error } = await supabase.from("patients").update({ status: "archived" }).eq("id", patient.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Paciente arquivado");
    onSaved();
  };

  const F = (label: string, key: keyof typeof form, type = "text") => (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type={type} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        {F("Nome completo", "full_name")}
        {F("E-mail", "email", "email")}
        {F("Telefone", "phone")}
        {F("Data de nascimento", "birth_date", "date")}
        {F("Cidade", "city")}
        {F("Estado", "state")}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <button onClick={archive}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
          <Archive className="h-4 w-4" /> Arquivar paciente
        </button>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar alterações
        </button>
      </div>
    </section>
  );
}
