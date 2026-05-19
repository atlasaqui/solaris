import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp, Loader2, MessageCircle, Image as ImageIcon, BarChart3, Send,
  Camera as CamIcon, Sun, Calendar, Plus, Check, X, Upload, Sparkles, Trophy, Lock,
  HelpCircle, Circle,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { computeLevel, LEVELS, PROGRESS_LEVEL_META, ACHIEVEMENTS, type AchievementKey, type ProgressLevel } from "@/lib/gamification";
import { toggleFeedbackStep } from "@/lib/clinical.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/app/evolution")({
  head: () => ({ meta: [{ title: "Acompanhamento" }] }),
  component: Evolution,
});

type Photo = {
  id: string; week_number: number; angle: string; storage_path: string;
  taken_at: string; doctor_comment: string | null; improvement_score: number | null;
  ai_analysis: any; ai_visible_to_patient: boolean; doctor_approved_at: string | null;
};

type Comment = {
  id: string; content: string; created_at: string; doctor_id: string | null; patient_id: string | null;
};

type Feedback = {
  id: string; photo_id: string | null; progress_level: ProgressLevel;
  message: string | null; next_steps: { text: string; done: boolean }[];
  include_ai_analysis: boolean; sent_at: string | null; week_number: number | null;
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

      <Tabs defaultValue="progress">
        <TabsList className="w-full justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger value="progress" className="flex-1 gap-1.5"><Sparkles className="h-4 w-4" /> Progresso</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 gap-1.5"><ImageIcon className="h-4 w-4" /> Fotos</TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 gap-1.5"><MessageCircle className="h-4 w-4" /> Chat</TabsTrigger>
          <TabsTrigger value="data" className="flex-1 gap-1.5"><BarChart3 className="h-4 w-4" /> Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <p className="mb-3 text-[12px] text-muted-foreground">Veja sua evolução semana a semana</p>
          <ProgressTab />
        </TabsContent>
        <TabsContent value="photos">
          <p className="mb-3 text-[12px] text-muted-foreground">Registre fotos para acompanhamento</p>
          <PhotosTab />
        </TabsContent>
        <TabsContent value="chat">
          <p className="mb-3 text-[12px] text-muted-foreground">Converse com seu dermatologista</p>
          <ChatTab />
        </TabsContent>
        <TabsContent value="data">
          <p className="mb-3 text-[12px] text-muted-foreground">Métricas e estatísticas do tratamento</p>
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
   TAB 0 — PROGRESSO (new)
   ============================================================ */
function ProgressTab() {
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [achievements, setAchievements] = useState<AchievementKey[]>([]);
  const [treatmentTotal, setTreatmentTotal] = useState(0);
  const [treatmentCurrent, setTreatmentCurrent] = useState(0);

  const toggleStep = useServerFn(toggleFeedbackStep);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data: pt } = await supabase.from("patients").select("id").eq("user_id", u.user.id).maybeSingle();
    if (!pt) { setLoading(false); return; }
    setPatientId(pt.id);

    const [pR, fR, aR, tR] = await Promise.all([
      supabase.from("evolution_photos").select("id, week_number, improvement_score, ai_analysis, ai_visible_to_patient, doctor_approved_at, taken_at")
        .eq("patient_id", pt.id).order("week_number", { ascending: true }),
      supabase.from("doctor_feedback").select("id, photo_id, progress_level, message, next_steps, include_ai_analysis, sent_at, week_number")
        .eq("patient_id", pt.id).eq("status", "sent").order("sent_at", { ascending: false }),
      supabase.from("patient_achievements").select("achievement").eq("patient_id", pt.id),
      supabase.from("treatments").select("total_weeks, current_week").eq("patient_id", pt.id).eq("status", "active").maybeSingle(),
    ]);
    setPhotos((pR.data ?? []) as any);
    setFeedbacks((fR.data ?? []) as any);
    setAchievements(((aR.data ?? []) as any[]).map((r) => r.achievement as AchievementKey));
    setTreatmentTotal(tR.data?.total_weeks ?? 0);
    setTreatmentCurrent(tR.data?.current_week ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const bestScore = useMemo(() => {
    const s = Math.max(0, ...photos.map((p) => Number(p.improvement_score ?? 0)));
    return Math.round(s);
  }, [photos]);

  const level = computeLevel(bestScore);
  const nextLevel = LEVELS[level.index] ?? null;
  const latestFeedback = feedbacks[0];

  if (loading) {
    return <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Sparkles className="mx-auto h-8 w-8" style={{ color: "var(--clinic-primary)" }} />
        <p className="mt-3 text-sm text-muted-foreground">Envie sua primeira foto para começar a acompanhar seu progresso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HERO — Progress + Level */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-3xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${level.color} 0%, var(--clinic-primary) 100%)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Seu nível</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl">{level.emoji}</span>
              <h2 className="font-display text-[22px] font-bold">{level.label}</h2>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="rounded-2xl bg-white/20 px-3 py-2 text-center backdrop-blur"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide opacity-90">Score</div>
            <div className="font-display text-2xl font-bold leading-none">{bestScore}</div>
          </motion.div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] opacity-90">
            <span>{level.min}%</span>
            <span>{nextLevel ? `Próximo: ${nextLevel.emoji} ${nextLevel.label}` : "Nível máximo"}</span>
            <span>{level.max}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((bestScore - level.min) / Math.max(1, level.max - level.min)) * 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full bg-white"
            />
          </div>
        </div>

        {treatmentTotal > 0 && (
          <div className="mt-4 flex items-center gap-2 text-[12px] opacity-95">
            <Calendar className="h-3.5 w-3.5" />
            Semana <strong className="font-semibold">{treatmentCurrent}</strong> de {treatmentTotal}
          </div>
        )}
      </motion.section>

      {/* Medical evaluation — only when doctor sent */}
      {latestFeedback ? (
        <MedicalEvaluationCard fb={latestFeedback} photos={photos} onToggle={async (idx, done) => {
          await toggleStep({ data: { feedbackId: latestFeedback.id, index: idx, done } });
          setFeedbacks((arr) => arr.map((f) => f.id === latestFeedback.id ? { ...f, next_steps: f.next_steps.map((s, i) => i === idx ? { ...s, done } : s) } : f));
        }} />
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Aguarde — seu médico ainda não enviou a avaliação. Você será notificado.
        </section>
      )}

      {/* Achievements */}
      <section className="rounded-2xl bg-white p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: "var(--clinic-primary)" }} />
          <h3 className="font-display text-[14px] font-semibold">Conquistas</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">{achievements.length} de {Object.keys(ACHIEVEMENTS).length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {(Object.keys(ACHIEVEMENTS) as AchievementKey[]).map((key, i) => {
            const a = ACHIEVEMENTS[key];
            const unlocked = achievements.includes(key);
            return (
              <motion.div
                key={key}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: i * 0.04 }}
                className={`flex flex-col items-center rounded-xl border p-2.5 text-center ${unlocked ? "border-[var(--clinic-primary)]/40 bg-[var(--clinic-primary-light)]" : "border-border bg-muted/30 opacity-50"}`}
              >
                <div className="text-2xl">{unlocked ? a.emoji : <Lock className="h-5 w-5 text-muted-foreground" />}</div>
                <div className="mt-1 text-[10px] font-semibold leading-tight">{a.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Weekly reminder */}
      <section className="flex items-center gap-3 rounded-2xl p-4" style={{ background: "var(--clinic-primary-light)" }}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--clinic-primary)" }}>
          <CamIcon className="h-4 w-4" />
        </div>
        <div className="text-[13px]">
          <div className="font-semibold" style={{ color: "var(--clinic-primary-dark)" }}>Lembrete da semana</div>
          <div className="text-muted-foreground">Não esqueça da sua foto desta semana e da proteção solar diária.</div>
        </div>
      </section>
    </div>
  );
}

function MedicalEvaluationCard({ fb, photos, onToggle }: {
  fb: Feedback; photos: Photo[];
  onToggle: (index: number, done: boolean) => Promise<void> | void;
}) {
  const meta = PROGRESS_LEVEL_META[fb.progress_level];
  const photo = photos.find((p) => p.id === fb.photo_id);
  const showAi = fb.include_ai_analysis && photo?.ai_visible_to_patient && photo?.ai_analysis;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 4px 24px rgba(27,138,122,0.15)", borderLeft: `4px solid ${meta.color}` }}
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: meta.color }}>
          <span className="text-lg">{meta.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Avaliação do médico</div>
          <div className="font-display text-[14px] font-semibold">{meta.label} {fb.week_number ? `· Semana ${fb.week_number}` : ""}</div>
        </div>
        {fb.sent_at && (
          <span className="text-[10px] text-muted-foreground">{new Date(fb.sent_at).toLocaleDateString("pt-BR")}</span>
        )}
      </div>

      <div className="space-y-4 p-5">
        {fb.message && (
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">{fb.message}</p>
        )}

        {showAi && (
          <div className="rounded-xl bg-[var(--clinic-primary-light)]/60 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--clinic-primary-dark)" }}>
              <Sparkles className="h-3 w-3" /> Análise Solaris IA
            </div>
            <p className="text-[13px] leading-relaxed">{photo?.ai_analysis?.suggestion}</p>
          </div>
        )}

        {fb.next_steps?.length > 0 && (
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Próximos passos</div>
            <div className="space-y-1.5">
              {fb.next_steps.map((s, i) => (
                <button key={i} onClick={() => onToggle(i, !s.done)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2 text-left transition hover:border-[var(--clinic-primary)]">
                  <div className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${s.done ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white" : "border-border"}`}>
                    {s.done && <Check className="h-3 w-3" />}
                  </div>
                  <span className={`text-[13px] ${s.done ? "text-muted-foreground line-through" : ""}`}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ============================================================
   TAB 1 — PHOTOS
   ============================================================ */
function PhotosTab() {
  const [photos, setPhotos] = useState<(Photo & { url: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (!pt) { setLoading(false); return; }
    setPatientId(pt.id);
    setClinicId(pt.clinic_id);
    const { data: tr } = await supabase.from("treatments").select("id, current_week")
      .eq("patient_id", pt.id).eq("status", "active").maybeSingle();
    if (tr) { setTreatmentId(tr.id); setCurrentWeek(tr.current_week ?? 1); }
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
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const renderEmpty = () => (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <CamIcon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">Comece registrando a foto desta semana.</p>
      <button
        onClick={() => setUploadOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white"
        style={{ background: "var(--clinic-primary)" }}
      >
        <Plus className="h-4 w-4" /> Enviar primeira foto
      </button>
    </div>
  );

  const first = photos[0];
  const current = photos.find((p) => p.week_number === selected) ?? photos[photos.length - 1];

  return (
    <div className="space-y-4">
      {photos.length === 0 ? renderEmpty() : (
        <>
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
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
            <button
              onClick={() => setUploadOpen(true)}
              className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white"
              style={{ background: "var(--clinic-primary)" }}
              aria-label="Enviar nova foto"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

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
        </>
      )}

      {uploadOpen && patientId && (
        <UploadPhotoSheet
          patientId={patientId}
          clinicId={clinicId}
          treatmentId={treatmentId}
          defaultWeek={currentWeek}
          onClose={() => setUploadOpen(false)}
          onUploaded={async () => { setUploadOpen(false); setLoading(true); await load(); }}
        />
      )}
    </div>
  );
}

/* ------------------ UPLOAD SHEET ------------------ */
function UploadPhotoSheet({
  patientId, clinicId, treatmentId, defaultWeek, onClose, onUploaded,
}: {
  patientId: string;
  clinicId: string | null;
  treatmentId: string | null;
  defaultWeek: number;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [week, setWeek] = useState<number>(defaultWeek);
  const [angle, setAngle] = useState<"frontal" | "lateral_left" | "lateral_right">("frontal");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [light, setLight] = useState(false);
  const [accessories, setAccessories] = useState(false);
  const [background, setBackground] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Imagem acima de 10MB."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) { toast.error("Selecione uma foto."); return; }
    if (!light || !accessories || !background) { toast.error("Confirme todos os itens do checklist."); return; }
    setSubmitting(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${patientId}/${week}-${angle}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("evolution-photos").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (up.error) throw up.error;
      const ins = await supabase.from("evolution_photos").insert({
        patient_id: patientId,
        clinic_id: clinicId,
        treatment_id: treatmentId,
        week_number: week,
        angle,
        storage_path: path,
        checklist_light: light,
        checklist_accessories: accessories,
        checklist_background: background,
      });
      if (ins.error) throw ins.error;
      toast.success("Foto enviada!");
      onUploaded();
    } catch (e: any) {
      toast.error(e.message ?? "Falha no envio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-[16px] font-semibold">Nova foto</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#0F172A]">
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[#0F172A]"
                >Trocar</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-[#F8FAFC]"
              >
                <CamIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-[13px] font-semibold text-muted-foreground">Tirar / escolher foto</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Semana</label>
              <input
                type="number" min={1} value={week}
                onChange={(e) => setWeek(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--clinic-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ângulo</label>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value as typeof angle)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--clinic-primary)]"
              >
                <option value="frontal">Frontal</option>
                <option value="lateral_left">Lateral esquerda</option>
                <option value="lateral_right">Lateral direita</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Checklist da foto</div>
            <div className="space-y-2">
              <ChecklistItem checked={light} onChange={setLight} label="Boa iluminação natural" />
              <ChecklistItem checked={accessories} onChange={setAccessories} label="Sem óculos, maquiagem ou acessórios" />
              <ChecklistItem checked={background} onChange={setBackground} label="Fundo neutro e câmera estável" />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--clinic-primary)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {submitting ? "Enviando..." : "Enviar foto"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 text-left"
    >
      <div
        className="grid h-5 w-5 place-items-center rounded-md transition"
        style={checked
          ? { background: "var(--clinic-primary)", color: "#fff" }
          : { background: "#F1F5F9", color: "transparent", border: "1px solid #E2E8F0" }}
      >
        <Check className="h-3.5 w-3.5" />
      </div>
      <span className="text-[13px]">{label}</span>
    </button>
  );
}

/* ============================================================
   TAB 2 — CHAT
   ============================================================ */
function ChatTab() {
  const [messages, setMessages] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
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
      await load(pt.id);
      setLoading(false);
    })();
  }, []);

  const send = async () => {
    const body = text.trim();
    if (!body || !patientId || sending) return;
    setSending(true);
    // Optimistic UI — show immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId, content: body, created_at: new Date().toISOString(),
      doctor_id: null, patient_id: patientId,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 30);

    const { error } = await supabase.from("clinical_comments").insert({
      patient_id: patientId,
      content: body,
      is_visible_to_patient: true,
    });
    setSending(false);
    if (error) {
      // Rollback + show error
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(body);
      toast.error("Falha ao enviar. Verifique sua conexão e tente novamente.");
      return;
    }
    await load(patientId);
  };

  if (loading) return <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const canSend = text.trim().length > 0 && !sending;

  return (
    <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      {/* Online header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-white px-4 py-2.5">
        <div className="relative">
          <div className="grid h-8 w-8 place-items-center rounded-full text-white text-[11px] font-bold" style={{ background: "var(--clinic-primary)" }}>
            DR
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight">Dermatologista</div>
          <div className="text-[10.5px] text-emerald-600">online agora</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
            <div>
              <MessageCircle className="mx-auto h-8 w-8" />
              <p className="mt-2">Nenhuma mensagem ainda.</p>
              <p className="mt-1 text-[11px]">Escreva abaixo para iniciar a conversa.</p>
            </div>
          </div>
        ) : messages.map((m) => {
          const fromDoctor = !!m.doctor_id;
          const isTemp = m.id.startsWith("temp-");
          return (
            <div key={m.id} className={`flex ${fromDoctor ? "justify-start" : "justify-end"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed"
                style={fromDoctor
                  ? { background: "#fff", color: "#0F172A", border: "1px solid #E2E8F0" }
                  : { background: "var(--clinic-primary)", color: "#fff", opacity: isTemp ? 0.7 : 1 }}
              >
                <div>{m.content}</div>
                <div className={`mt-1 flex items-center gap-1 text-[10px] ${fromDoctor ? "text-muted-foreground" : "text-white/80"}`}>
                  <span>{new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  {!fromDoctor && (
                    isTemp
                      ? <Circle className="h-3 w-3" />
                      : <Check className="h-3 w-3" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-white p-3">
        <div className="relative flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canSend) send(); }}
            placeholder="Escreva uma mensagem..."
            className="w-full rounded-full border border-border bg-[#F8FAFC] px-4 py-2 pr-9 text-[13px] outline-none focus:border-[var(--clinic-primary)]"
          />
          {text.length > 0 && (
            <button
              type="button"
              onClick={() => setText("")}
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
              aria-label="Limpar mensagem"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          onClick={send}
          disabled={!canSend}
          className="grid h-10 w-10 place-items-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "var(--clinic-primary)" }}
          aria-label="Enviar mensagem"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 3 — DATA
   ============================================================ */
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
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--clinic-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--clinic-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="var(--clinic-primary)" strokeWidth={2.5} fill="url(#evoFill)" />
              </AreaChart>
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
