import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --------- Schemas ---------
const AnalyzeInput = z.object({
  photoId: z.string().uuid(),
});

const AnalysisSchema = z.object({
  pigmentation_delta_pct: z.number(),       // negative = improvement
  area_delta_pct: z.number(),               // negative = improvement
  uniformity_delta_pct: z.number(),         // positive = improvement
  improvement_score: z.number().min(0).max(100),
  classification: z.enum(["none", "mild", "moderate", "great", "excellent"]),
  suggestion: z.string(),
});

type Analysis = z.infer<typeof AnalysisSchema>;

// --------- Analyze photo with Lovable AI ---------
export const analyzePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: photo, error: pErr } = await supabase
      .from("evolution_photos")
      .select("id, patient_id, clinic_id, week_number, storage_path, ai_analysis, treatment_id")
      .eq("id", data.photoId)
      .maybeSingle();
    if (pErr || !photo) throw new Error("Foto não encontrada");
    if (!photo.patient_id) throw new Error("Foto sem paciente associado");

    // Reference: week 1 photo for the same patient/treatment
    const { data: baseline } = await supabase
      .from("evolution_photos")
      .select("storage_path, week_number")
      .eq("patient_id", photo.patient_id)
      .order("week_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    const [{ data: nowSigned }, baselineSigned] = await Promise.all([
      supabase.storage.from("evolution-photos").createSignedUrl(photo.storage_path, 600),
      baseline?.storage_path
        ? supabase.storage.from("evolution-photos").createSignedUrl(baseline.storage_path, 600)
        : Promise.resolve({ data: null as { signedUrl: string } | null }),
    ]);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway não configurado");

    const sys = `Você é um assistente dermatológico que ANALISA fotos clínicas comparando a evolução de um paciente.
Sua análise é auxiliar — não substitui o médico. Devolva SOMENTE JSON válido com este formato:
{
  "pigmentation_delta_pct": number,   // variação de pigmentação em % (negativo = melhora)
  "area_delta_pct": number,           // variação da área afetada em % (negativo = melhora)
  "uniformity_delta_pct": number,     // variação de uniformidade do tom em % (positivo = melhora)
  "improvement_score": number,        // 0-100 (acumulado desde a semana 1)
  "classification": "none" | "mild" | "moderate" | "great" | "excellent",
  "suggestion": string                // 1-2 frases de sugestão clínica, em PT-BR
}`;

    const userText = baselineSigned?.data
      ? `Compare a foto atual (semana ${photo.week_number}) com a foto de referência (semana ${baseline?.week_number}).`
      : `Avalie a foto atual (semana ${photo.week_number}). Não há foto de referência ainda — devolva valores conservadores.`;

    const content: any[] = [{ type: "text", text: userText }];
    if (nowSigned?.signedUrl) content.push({ type: "image_url", image_url: { url: nowSigned.signedUrl } });
    if (baselineSigned?.data?.signedUrl)
      content.push({ type: "image_url", image_url: { url: baselineSigned.data.signedUrl } });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
      throw new Error(`Falha na análise: ${t}`);
    }
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Analysis;
    try {
      parsed = AnalysisSchema.parse(JSON.parse(raw));
    } catch {
      // Fallback safe defaults
      parsed = {
        pigmentation_delta_pct: 0,
        area_delta_pct: 0,
        uniformity_delta_pct: 0,
        improvement_score: 0,
        classification: "none",
        suggestion: "Não foi possível interpretar a resposta da IA. Avalie manualmente.",
      };
    }

    const { error: upErr } = await supabase
      .from("evolution_photos")
      .update({ ai_analysis: parsed })
      .eq("id", photo.id);
    if (upErr) throw new Error(upErr.message);

    return parsed;
  });

// --------- Save / send doctor feedback ---------
const FeedbackInput = z.object({
  id: z.string().uuid().optional(),
  photoId: z.string().uuid(),
  patientId: z.string().uuid(),
  treatmentId: z.string().uuid().nullable().optional(),
  weekNumber: z.number().int().min(1).max(52).nullable().optional(),
  progressLevel: z.enum(["none", "mild", "moderate", "great", "excellent"]),
  message: z.string().max(4000).optional().default(""),
  nextSteps: z.array(z.object({ text: z.string().min(1).max(500), done: z.boolean().default(false) })).max(20).default([]),
  includeAiAnalysis: z.boolean().default(true),
  send: z.boolean().default(false),
});

export const saveDoctorFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => FeedbackInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, clinic_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!doctor) throw new Error("Apenas médicos podem enviar feedback");

    const payload = {
      photo_id: data.photoId,
      patient_id: data.patientId,
      doctor_id: doctor.id,
      clinic_id: doctor.clinic_id,
      treatment_id: data.treatmentId ?? null,
      week_number: data.weekNumber ?? null,
      progress_level: data.progressLevel,
      message: data.message ?? "",
      next_steps: data.nextSteps ?? [],
      include_ai_analysis: data.includeAiAnalysis,
      status: data.send ? "sent" : "draft",
      sent_at: data.send ? new Date().toISOString() : null,
    };

    let feedbackId = data.id;
    if (feedbackId) {
      const { error } = await supabase.from("doctor_feedback").update(payload).eq("id", feedbackId);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await supabase
        .from("doctor_feedback")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      feedbackId = ins.id;
    }

    if (data.send) {
      // Mark the photo as reviewed + reveal AI to patient (if doctor allowed)
      await supabase
        .from("evolution_photos")
        .update({
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
          doctor_approved_at: new Date().toISOString(),
          ai_visible_to_patient: data.includeAiAnalysis,
        })
        .eq("id", data.photoId);

      // Notify patient
      const { data: patient } = await supabase
        .from("patients")
        .select("user_id")
        .eq("id", data.patientId)
        .maybeSingle();
      if (patient?.user_id) {
        await supabase.from("notifications").insert({
          recipient_id: patient.user_id,
          clinic_id: doctor.clinic_id,
          type: "doctor_feedback",
          title: "Nova avaliação clínica",
          body: "Seu médico enviou a avaliação da sua foto desta semana.",
          data: { photo_id: data.photoId, feedback_id: feedbackId },
        });
      }

      // Achievements
      await evaluateAchievements(supabase, data.patientId, doctor.clinic_id);
    }

    return { id: feedbackId, status: payload.status };
  });

// --------- Toggle checklist item (patient side) ---------
export const toggleFeedbackStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ feedbackId: z.string().uuid(), index: z.number().int().min(0), done: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: fb, error } = await supabase
      .from("doctor_feedback")
      .select("next_steps")
      .eq("id", data.feedbackId)
      .maybeSingle();
    if (error || !fb) throw new Error("Feedback não encontrado");

    const steps = Array.isArray(fb.next_steps) ? [...(fb.next_steps as any[])] : [];
    if (steps[data.index]) {
      steps[data.index] = { ...steps[data.index], done: data.done };
      const { error: upErr } = await supabase
        .from("doctor_feedback")
        .update({ next_steps: steps })
        .eq("id", data.feedbackId);
      if (upErr) throw new Error(upErr.message);
    }
    return { ok: true };
  });

// --------- Achievements engine ---------
async function evaluateAchievements(supabase: any, patientId: string, clinicId: string | null) {
  const [{ data: photos }, { data: existing }] = await Promise.all([
    supabase
      .from("evolution_photos")
      .select("week_number, improvement_score, taken_at")
      .eq("patient_id", patientId)
      .order("week_number", { ascending: true }),
    supabase.from("patient_achievements").select("achievement").eq("patient_id", patientId),
  ]);

  const unlocked = new Set<string>((existing ?? []).map((r: any) => r.achievement));
  const toAdd: string[] = [];
  const weeks = (photos ?? []).map((p: any) => p.week_number).sort((a: number, b: number) => a - b);
  const maxScore = Math.max(0, ...(photos ?? []).map((p: any) => Number(p.improvement_score ?? 0)));

  const consider = (key: string, ok: boolean) => { if (ok && !unlocked.has(key)) toAdd.push(key); };

  consider("first_photo", weeks.length >= 1);
  consider("first_improvement", maxScore > 0);
  consider("moderate_improvement", maxScore >= 40);
  consider("great_improvement", maxScore >= 70);
  consider("transformation", maxScore >= 90);

  // Streaks based on consecutive week_number values present
  let best = 0, run = 0, prev = -1;
  for (const w of weeks) {
    if (w === prev + 1 || prev === -1) run += 1; else run = 1;
    best = Math.max(best, run);
    prev = w;
  }
  consider("streak_4", best >= 4);
  consider("streak_8", best >= 8);

  if (toAdd.length) {
    await supabase.from("patient_achievements").insert(
      toAdd.map((a) => ({ patient_id: patientId, clinic_id: clinicId, achievement: a })),
    );
  }

  return toAdd;
}
