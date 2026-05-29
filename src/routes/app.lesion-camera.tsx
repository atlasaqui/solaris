import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Info, Loader2, RotateCcw, Send } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const nav = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        setError("Não foi possível acessar a câmera. Use o botão da galeria abaixo.");
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const capture = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    canvas.toBlob((b) => {
      if (!b) return;
      setPreview({ blob: b, url: URL.createObjectURL(b) });
    }, "image/jpeg", 0.85);
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPreview({ blob: f, url: URL.createObjectURL(f) });
  };

  const retake = () => { if (preview) URL.revokeObjectURL(preview.url); setPreview(null); };

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
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PatientHeader title="Analisar lesão" showBack />
      <div className="px-4 py-4 pb-24">
        <div className="flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Posicione a lesão centralizada e bem iluminada antes de capturar.
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: "3/4", border: "2px solid var(--clinic-primary-dark)" }}>
          {preview ? (
            <img src={preview.url} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : error ? (
            <div className="grid h-full place-items-center p-6 text-center text-[13px] text-gray-600">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          )}
        </div>

        {!preview ? (
          <>
            <div className="mt-6 grid place-items-center">
              <button onClick={capture} disabled={!!error} aria-label="Capturar" className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition active:scale-95 disabled:opacity-50" style={{ border: "3px solid var(--clinic-primary)" }}>
                <div className="h-12 w-12 rounded-full" style={{ background: "var(--clinic-primary)" }} />
              </button>
            </div>
            <button onClick={() => fileRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-[14px] font-semibold" style={{ borderColor: "var(--clinic-primary)", color: "var(--clinic-primary-dark)" }}>
              <ImagePlus className="h-4 w-4" /> Selecionar da galeria
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          </>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={retake} disabled={busy} className="flex items-center justify-center gap-2 rounded-2xl border py-4 text-[15px] font-bold" style={{ borderColor: "var(--clinic-primary)", color: "var(--clinic-primary-dark)" }}>
              <RotateCcw className="h-4 w-4" /> Refazer
            </button>
            <button onClick={submit} disabled={busy} className="flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))", boxShadow: "0 4px 16px rgba(var(--clinic-primary-rgb),0.35)" }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {busy ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-[12px] text-gray-400">
          A imagem será analisada pelo(a) médico(a) responsável.
        </p>
      </div>
    </>
  );
}
