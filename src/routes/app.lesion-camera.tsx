import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/lesion-camera")({
  head: () => ({ meta: [{ title: "Analisar lesão" }] }),
  component: Page,
});

function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = async () => {
    if (!videoRef.current || busy) return;
    setBusy(true);
    try {
      const v = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(v, 0, 0);
      const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.85));

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) throw new Error("Paciente não encontrado");

      const path = `${pt.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("evolution-photos").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("evolution_photos").insert({
        patient_id: pt.id,
        clinic_id: pt.clinic_id,
        storage_path: path,
        week_number: 0,
        angle: "lesao",
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
      <div className="px-4 py-4">
        <div className="flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Posicione a lesão centralizada e bem iluminada antes de capturar.
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: "3/4", border: "2px solid var(--clinic-primary-dark)" }}>
          {error ? (
            <div className="grid h-full place-items-center p-6 text-center text-[13px] text-gray-600">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          )}
        </div>
        <div className="mt-6 grid place-items-center">
          <button onClick={capture} disabled={busy || !!error} aria-label="Capturar" className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition active:scale-95 disabled:opacity-50" style={{ border: "3px solid #D1D5DB" }}>
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="h-12 w-12 rounded-full bg-white" style={{ border: "2px solid #D1D5DB" }} />}
          </button>
        </div>
        <div className="mt-6 rounded-t-3xl p-6 text-center text-[15px] font-bold text-white" style={{ background: "var(--clinic-primary-dark)" }}>
          Após o envio da imagem espere o retorno do(a) médico(a) para as próximas instruções.
        </div>
      </div>
    </>
  );
}
