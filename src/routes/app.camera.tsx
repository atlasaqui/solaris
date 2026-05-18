import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Upload, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/camera")({
  head: () => ({ meta: [{ title: "Foto da semana" }] }),
  component: Camera,
});

type Ctx = { patientId: string; clinicId: string; treatmentId: string | null; weekNumber: number };

function Camera() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({ light: false, accessories: false, background: false });
  const [angle, setAngle] = useState<"frontal" | "lateral_esq" | "lateral_dir">("frontal");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) return;
      const { data: tr } = await supabase.from("treatments").select("id, current_week")
        .eq("patient_id", pt.id).eq("status", "active").order("started_at", { ascending: false }).maybeSingle();
      setCtx({ patientId: pt.id, clinicId: pt.clinic_id!, treatmentId: tr?.id ?? null, weekNumber: tr?.current_week ?? 1 });
    })();
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error("Imagem acima de 15MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file || !ctx) return;
    if (!Object.values(checklist).every(Boolean)) { toast.error("Confirme o checklist antes de enviar"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${ctx.clinicId}/${ctx.patientId}/w${ctx.weekNumber}-${angle}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("evolution-photos").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { error: dbErr } = await supabase.from("evolution_photos").insert({
      patient_id: ctx.patientId, clinic_id: ctx.clinicId, treatment_id: ctx.treatmentId,
      week_number: ctx.weekNumber, angle, storage_path: path,
      checklist_light: checklist.light, checklist_accessories: checklist.accessories, checklist_background: checklist.background,
    });
    setUploading(false);
    if (dbErr) { toast.error(dbErr.message); return; }
    toast.success("Foto registrada!");
    navigate({ to: "/app/evolution" });
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[22px] font-semibold">Foto da semana</h1>
        <p className="text-[13px] text-muted-foreground">Semana {ctx?.weekNumber ?? "—"} · {angle === "frontal" ? "Frontal" : angle === "lateral_esq" ? "Lateral esquerdo" : "Lateral direito"}</p>
      </header>

      <div className="overflow-hidden rounded-3xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
        <div className="grid aspect-[3/4] w-full place-items-center bg-[#0F172A] text-white/60">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> :
            <div className="text-center"><CameraIcon className="mx-auto h-10 w-10" /><p className="mt-2 text-sm">Sem foto ainda</p></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onSelect} className="hidden" />
        <div className="grid grid-cols-2 gap-2 p-3">
          <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white" style={{ background: "var(--clinic-primary)" }}>
            <CameraIcon className="h-4 w-4" /> Tirar foto
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl bg-[#F1F5F9] py-3 text-sm font-semibold">
            <Upload className="h-4 w-4" /> Da galeria
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <h2 className="font-display text-[15px] font-semibold">Ângulo</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([
            { id: "frontal", label: "Frontal" },
            { id: "lateral_esq", label: "Lat. Esq" },
            { id: "lateral_dir", label: "Lat. Dir" },
          ] as const).map((a) => (
            <button key={a.id} onClick={() => setAngle(a.id)} className="rounded-xl py-2 text-[12px] font-semibold"
              style={angle === a.id ? { background: "var(--clinic-primary)", color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}>
              {a.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <h2 className="font-display text-[15px] font-semibold">Checklist</h2>
        <div className="mt-2 space-y-2">
          {[
            { k: "light", label: "Boa iluminação natural" },
            { k: "accessories", label: "Sem maquiagem ou acessórios" },
            { k: "background", label: "Fundo neutro" },
          ].map((c) => (
            <label key={c.k} className="flex cursor-pointer items-center gap-3 rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-[13px]">
              <input type="checkbox" checked={checklist[c.k as keyof typeof checklist]}
                onChange={(e) => setChecklist({ ...checklist, [c.k]: e.target.checked })} className="hidden" />
              <span className="grid h-5 w-5 place-items-center rounded-md border-2"
                style={{
                  borderColor: checklist[c.k as keyof typeof checklist] ? "var(--clinic-primary)" : "#CBD5E1",
                  background: checklist[c.k as keyof typeof checklist] ? "var(--clinic-primary)" : "transparent",
                }}>
                {checklist[c.k as keyof typeof checklist] && <Check className="h-3 w-3 text-white" />}
              </span>
              {c.label}
            </label>
          ))}
        </div>
      </section>

      <button onClick={upload} disabled={!file || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--clinic-primary)" }}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Enviar foto
      </button>
    </div>
  );
}
