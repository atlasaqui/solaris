import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import backBtn from "@/assets/solaris/screen-11/btn-icon-back.png";
import calloutTip from "@/assets/solaris/screen-11/callout-voice-capture-tip.png";
import cardInstruction from "@/assets/solaris/screen-11/card-capture-instruction.png";
import viewfinderEmpty from "@/assets/solaris/screen-11/viewfinder-camera-empty.png";
import stepperActive from "@/assets/solaris/screen-11/stepper-dot-active.png";
import stepperInactive from "@/assets/solaris/screen-12/stepper-dot-desactive.png";

import viewfinderActive from "@/assets/solaris/screen-12/viewfinder-camera-active.png";
import overlayCrosshair from "@/assets/solaris/screen-12/overlay-crosshair.png";
import badgeFocus from "@/assets/solaris/screen-12/badge-detection-focus.png";
import captureRing from "@/assets/solaris/screen-12/btn-capture-ring.png";

export const Route = createFileRoute("/app/lesion-camera")({
  head: () => ({ meta: [{ title: "Analisar lesão" }] }),
  component: Page,
});

function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (!alive) { s.getTracks().forEach((t) => t.stop()); return; }
        setStream(s);
        setActive(true);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        setError("Não foi possível acessar a câmera. Use a galeria abaixo.");
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const capture = () => {
    if (!videoRef.current || !active) return;
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && setPreview({ blob: b, url: URL.createObjectURL(b) }), "image/jpeg", 0.9);
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPreview({ blob: f, url: URL.createObjectURL(f) });
  };

  const submit = async () => {
    if (!preview || busy) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) throw new Error("Paciente não encontrado");
      const path = `${pt.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("evolution-photos").upload(path, preview.blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("evolution_photos").insert({
        patient_id: pt.id, clinic_id: pt.clinic_id, storage_path: path, week_number: 0, angle: "lesao",
      });
      if (insErr) throw insErr;
      toast.success("Imagem enviada!");
      nav({ to: "/app/lesion-results" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-white pb-10" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <button onClick={() => nav({ to: "/app/home" })} aria-label="Voltar">
          <img src={backBtn} alt="" className="h-10 w-10" />
        </button>
        <h1 className="text-[15px] font-semibold" style={{ color: "#1472D0" }}>Capturar lesão</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Stepper */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <img src={stepperActive} alt="" className="h-2" />
        <img src={stepperInactive} alt="" className="h-2" />
        <img src={stepperInactive} alt="" className="h-2" />
      </div>

      {/* Instruction card */}
      <div className="mx-5 mt-5">
        <img src={cardInstruction} alt="Posicione a lesão centralizada" className="w-full" />
      </div>

      {/* Viewfinder */}
      <div className="relative mx-5 mt-4">
        <div className="relative overflow-hidden rounded-[32px]" style={{ aspectRatio: "3/4" }}>
          {preview ? (
            <img src={preview.url} alt="Pré-visualização" className="absolute inset-0 h-full w-full object-cover" />
          ) : active ? (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={viewfinderEmpty} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {active && !preview && (
            <>
              <img src={viewfinderActive} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              <img src={overlayCrosshair} alt="" className="pointer-events-none absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2" />
              <img src={badgeFocus} alt="" className="pointer-events-none absolute right-4 top-4 h-10" />
            </>
          )}
          {error && (
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-3 text-center text-[12px]" style={{ color: "#1472D0" }}>{error}</div>
          )}
        </div>
      </div>

      {/* Voice tip */}
      <div className="mx-5 mt-4">
        <img src={calloutTip} alt="Dica: você pode usar comando de voz" className="w-full" />
      </div>

      {/* Capture / actions */}
      <div className="mt-5 flex flex-col items-center gap-3">
        {!preview ? (
          <>
            <button onClick={capture} disabled={!active} aria-label="Capturar" className="transition active:scale-95 disabled:opacity-50">
              <img src={captureRing} alt="" className="h-[88px] w-[88px]" />
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "#1472D0" }}>
              <ImagePlus className="h-4 w-4" /> Selecionar da galeria
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          </>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 px-5">
            <button
              onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}
              disabled={busy}
              className="rounded-2xl border-2 py-3.5 text-[14px] font-bold"
              style={{ borderColor: "#1472D0", color: "#1472D0" }}
            >
              Refazer
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-bold text-white disabled:opacity-60"
              style={{ background: "#1472D0" }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
