import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Video, Upload, Circle, Square, Scissors, Type as TypeIcon,
  Volume2, VolumeX, Wand2, Smartphone, Monitor, Gauge, Image as ImageIcon,
  Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Loader2, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadToStorageWithProgress } from "@/lib/storage-upload";

export const Route = createFileRoute("/admin/content/video-editor")({
  head: () => ({ meta: [{ title: "Editor de vídeo" }] }),
  component: () => <VideoEditorPanel />,
});

const FILTERS: { id: string; label: string; css: string }[] = [
  { id: "original", label: "Original", css: "none" },
  { id: "bright", label: "Brilho+", css: "brightness(1.2) saturate(1.1)" },
  { id: "contrast", label: "Contraste+", css: "contrast(1.25) saturate(1.1)" },
  { id: "warm", label: "Quente", css: "sepia(0.25) saturate(1.2) hue-rotate(-10deg)" },
  { id: "cool", label: "Frio", css: "saturate(1.1) hue-rotate(15deg) brightness(1.05)" },
  { id: "bw", label: "P&B", css: "grayscale(1) contrast(1.1)" },
];
const SPEEDS = [0.5, 1, 1.5];

type Step = "capture" | "edit" | "publish";

export function VideoEditorPanel({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("capture");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // editor state
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [muted, setMuted] = useState(false);
  const [filter, setFilter] = useState("original");
  const [aspect, setAspect] = useState<"9:16" | "16:9">("9:16");
  const [speed, setSpeed] = useState(1);
  const [overlay, setOverlay] = useState<{ text: string; x: number; y: number; size: number; color: string } | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string>("");
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null);

  // capture state
  const camRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // edit refs
  const playerRef = useRef<HTMLVideoElement>(null);

  // publish
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  /* ----- CAPTURE ----- */
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = s;
      if (camRef.current) { camRef.current.srcObject = s; camRef.current.play(); }
      setPreviewing(true);
    } catch (e: any) { toast.error("Não foi possível acessar a câmera: " + e.message); }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      acceptVideo(blob);
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };
  const stopRecording = () => {
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    setPreviewing(false);
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Arquivo precisa ser um vídeo"); return; }
    acceptVideo(file);
  };

  const acceptVideo = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setVideoBlob(blob);
    setVideoUrl(url);
    setStep("edit");
  };

  /* ----- EDIT ----- */
  useEffect(() => {
    const v = playerRef.current;
    if (!v) return;
    v.playbackRate = speed;
    v.muted = muted;
  }, [speed, muted, step]);

  useEffect(() => {
    if (step !== "edit") return;
    const v = playerRef.current; if (!v) return;
    const onMeta = () => { setDuration(v.duration); setTrimEnd(v.duration); };
    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.currentTime >= trimEnd) { v.pause(); v.currentTime = trimEnd; setPlaying(false); }
      if (v.currentTime < trimStart) v.currentTime = trimStart;
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    return () => { v.removeEventListener("loadedmetadata", onMeta); v.removeEventListener("timeupdate", onTime); };
  }, [step, trimStart, trimEnd]);

  const togglePlay = () => {
    const v = playerRef.current; if (!v) return;
    if (v.paused) { if (v.currentTime < trimStart || v.currentTime >= trimEnd) v.currentTime = trimStart; v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };
  const seek = (t: number) => { const v = playerRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min(duration, t)); };

  const captureThumb = () => {
    const v = playerRef.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    ctx.filter = FILTERS.find((f) => f.id === filter)?.css || "none";
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => {
      if (!b) return;
      setThumbBlob(b);
      setThumbUrl(URL.createObjectURL(b));
      toast.success("Frame capturado como capa");
    }, "image/jpeg", 0.85);
  };
  const uploadThumbFile = (f?: File) => {
    if (!f) return;
    setThumbBlob(f); setThumbUrl(URL.createObjectURL(f));
  };

  /* ----- PUBLISH ----- */
  const publish = async () => {
    if (!videoBlob || !title.trim()) { toast.error("Defina um título"); return; }
    setPublishing(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: doc } = await supabase.from("doctors").select("id, clinic_id").eq("user_id", u.user!.id).maybeSingle();
      if (!doc?.clinic_id) throw new Error("Clínica não encontrada");

      setUploadProgress(1);
      const baseId = crypto.randomUUID();
      const videoExt = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const videoPath = `${doc.clinic_id}/${baseId}.${videoExt}`;
      await uploadToStorageWithProgress({
        bucket: "content-videos",
        path: videoPath,
        file: videoBlob,
        contentType: videoBlob.type || "video/webm",
        onProgress: (value) => setUploadProgress(Math.min(value, 88)),
      });
      const { data: vSigned } = await supabase.storage.from("content-videos").createSignedUrl(videoPath, 60 * 60 * 24 * 365);

      let thumbPublicUrl: string | null = null;
      if (thumbBlob) {
        const tPath = `${doc.clinic_id}/${baseId}.jpg`;
        await uploadToStorageWithProgress({ bucket: "content-thumbnails", path: tPath, file: thumbBlob, contentType: thumbBlob.type || "image/jpeg", onProgress: (value) => setUploadProgress(88 + Math.round(value * 0.07)) });
        const { data: pub } = supabase.storage.from("content-thumbnails").getPublicUrl(tPath);
        thumbPublicUrl = pub.publicUrl;
      }

      const editorMeta = {
        editor: { trimStart, trimEnd, filter, aspect, speed, muted, overlay },
      };

      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}-${Date.now().toString(36)}`;
      const { error: pErr } = await supabase.from("content_posts").insert({
        clinic_id: doc.clinic_id, author_id: doc.id, type: "video",
        title: title.trim(), slug, category: category.trim() || null,
        video_url: vSigned?.signedUrl ?? null, video_storage_path: videoPath,
        video_thumbnail_url: thumbPublicUrl,
        duration_seconds: Math.max(1, Math.round(trimEnd - trimStart)),
        is_published: true, published_at: new Date().toISOString(),
        content: JSON.stringify(editorMeta),
      });
      if (pErr) throw pErr;

      setUploadProgress(100);
      toast.success("Vídeo publicado");
      navigate({ to: "/admin/content/list" });
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao publicar");
    } finally { setPublishing(false); setTimeout(() => setUploadProgress(0), 900); }
  };

  const filterCss = FILTERS.find((f) => f.id === filter)?.css ?? "none";
  const aspectClass = aspect === "9:16" ? "aspect-[9/16] max-w-[360px]" : "aspect-video max-w-[640px]";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {!embedded && (
        <Link to="/admin/content/list" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para biblioteca
        </Link>
      )}

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Video className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Editor de vídeo</h1>
            <p className="text-sm text-muted-foreground">Grave ou importe, edite e publique direto da clínica.</p>
          </div>
        </div>
        <Stepper step={step} />
      </header>

      {/* CAPTURE */}
      {step === "capture" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-base font-semibold">Gravar com a câmera</h2>
            <div className="relative aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-xl bg-black">
              <video ref={camRef} muted playsInline className="h-full w-full object-cover" />
              {!previewing && <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">Câmera desligada</div>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!previewing ? (
                <button onClick={startCamera} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <Video className="h-4 w-4" /> Ligar câmera
                </button>
              ) : !recording ? (
                <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
                  <Circle className="h-4 w-4 fill-current" /> Iniciar gravação
                </button>
              ) : (
                <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background">
                  <Square className="h-4 w-4 fill-current" /> Parar
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-base font-semibold">Importar vídeo</h2>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="flex aspect-[9/16] max-w-[320px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/40 text-center text-sm text-muted-foreground hover:border-primary hover:text-foreground">
              <Upload className="h-8 w-8" />
              <span>Arraste um vídeo aqui<br /><span className="text-xs">ou clique para selecionar</span></span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        </section>
      )}

      {/* EDIT */}
      {step === "edit" && (
        <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Preview */}
          <div className="space-y-3">
            <div className={`relative mx-auto w-full overflow-hidden rounded-2xl bg-black ${aspectClass}`}>
              <video ref={playerRef} src={videoUrl} className="h-full w-full object-cover"
                style={{ filter: filterCss }} onClick={togglePlay} />
              {overlay && (
                <div
                  draggable
                  onDragEnd={(e) => {
                    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setOverlay({ ...overlay, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) });
                  }}
                  className="absolute cursor-move px-2 py-1 font-semibold drop-shadow"
                  style={{ left: `${overlay.x}%`, top: `${overlay.y}%`, fontSize: overlay.size, color: overlay.color }}>
                  {overlay.text}
                </div>
              )}
            </div>

            {/* Transport */}
            <div className="flex items-center justify-center gap-2">
              <IconBtn onClick={() => seek(0)}><SkipBack className="h-4 w-4" /></IconBtn>
              <IconBtn onClick={() => seek(current - 10)}><Rewind className="h-4 w-4" /><span className="sr-only">Voltar 10s</span></IconBtn>
              <button onClick={togglePlay} className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
              </button>
              <IconBtn onClick={() => seek(current + 10)}><FastForward className="h-4 w-4" /><span className="sr-only">Avançar 10s</span></IconBtn>
              <IconBtn onClick={() => seek(duration)}><SkipForward className="h-4 w-4" /></IconBtn>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="tabular-nums">{fmt(current)}</span>
                <span className="font-semibold text-primary">Trecho: {fmt(trimEnd - trimStart)}</span>
                <span className="tabular-nums">{fmt(duration)}</span>
              </div>
              <div className="relative h-12 select-none">
                {/* track */}
                <div className="absolute inset-y-4 left-0 right-0 rounded-full bg-secondary" />
                {/* selected range */}
                {duration > 0 && (
                  <div className="absolute inset-y-4 rounded-full bg-primary/40 ring-1 ring-primary/60"
                    style={{ left: `${(trimStart / duration) * 100}%`, right: `${100 - (trimEnd / duration) * 100}%` }} />
                )}
                {/* outside ranges dimmed */}
                {duration > 0 && (
                  <>
                    <div className="absolute inset-y-4 left-0 rounded-l-full bg-foreground/10"
                      style={{ width: `${(trimStart / duration) * 100}%` }} />
                    <div className="absolute inset-y-4 right-0 rounded-r-full bg-foreground/10"
                      style={{ width: `${100 - (trimEnd / duration) * 100}%` }} />
                  </>
                )}
                {/* playhead */}
                {duration > 0 && (
                  <div className="pointer-events-none absolute top-0 h-12 w-0.5 bg-destructive"
                    style={{ left: `${(current / duration) * 100}%` }}>
                    <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-destructive shadow" />
                  </div>
                )}
                {/* trim handles visual */}
                {duration > 0 && (
                  <>
                    <div className="pointer-events-none absolute top-2 grid h-8 w-3 -translate-x-1/2 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground shadow"
                      style={{ left: `${(trimStart / duration) * 100}%` }}>‖</div>
                    <div className="pointer-events-none absolute top-2 grid h-8 w-3 -translate-x-1/2 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground shadow"
                      style={{ left: `${(trimEnd / duration) * 100}%` }}>‖</div>
                  </>
                )}
                {/* draggable inputs (transparent, stacked) */}
                <input type="range" min={0} max={duration || 1} step="0.05" value={trimStart}
                  onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.1))}
                  className="trim-range absolute inset-0 w-full appearance-none bg-transparent" />
                <input type="range" min={0} max={duration || 1} step="0.05" value={trimEnd}
                  onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.1))}
                  className="trim-range absolute inset-0 w-full appearance-none bg-transparent" />
              </div>
              <div className="mt-3">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Playhead</div>
                <input type="range" min={0} max={duration || 1} step="0.05" value={current}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
              <style>{`
                .trim-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 40px; width: 16px; background: transparent; cursor: ew-resize; }
                .trim-range::-moz-range-thumb { height: 40px; width: 16px; background: transparent; border: none; cursor: ew-resize; }
                .trim-range::-webkit-slider-runnable-track { background: transparent; }
                .trim-range::-moz-range-track { background: transparent; }
              `}</style>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { setStep("capture"); setVideoBlob(null); setVideoUrl(""); }}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
                Refazer
              </button>
              <button onClick={() => setStep("publish")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Próximo: publicar <Check className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <aside className="space-y-4">
            <Tool icon={<Scissors className="h-4 w-4" />} title="Cortar">
              <div className="text-[11px] text-muted-foreground">Use os marcadores na timeline para definir início e fim.</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setTrimStart(current)} className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:bg-secondary">Início aqui</button>
                <button onClick={() => setTrimEnd(current)} className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:bg-secondary">Fim aqui</button>
              </div>
            </Tool>

            <Tool icon={<TypeIcon className="h-4 w-4" />} title="Texto">
              <input type="text" placeholder="Legenda sobreposta"
                value={overlay?.text ?? ""} onChange={(e) => setOverlay({ text: e.target.value, x: overlay?.x ?? 10, y: overlay?.y ?? 80, size: overlay?.size ?? 24, color: overlay?.color ?? "#ffffff" })}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-primary" />
              {overlay && (
                <div className="mt-2 flex items-center gap-2">
                  <input type="range" min={12} max={64} value={overlay.size} onChange={(e) => setOverlay({ ...overlay, size: Number(e.target.value) })} className="flex-1" />
                  <input type="color" value={overlay.color} onChange={(e) => setOverlay({ ...overlay, color: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-border bg-background" />
                  <button onClick={() => setOverlay(null)} className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary">Remover</button>
                </div>
              )}
            </Tool>

            <Tool icon={muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} title="Áudio">
              <button onClick={() => setMuted((m) => !m)}
                className={`w-full rounded-lg px-3 py-1.5 text-[12px] font-semibold ${muted ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"}`}>
                {muted ? "Áudio silenciado" : "Áudio do vídeo ativo"}
              </button>
            </Tool>

            <Tool icon={<Wand2 className="h-4 w-4" />} title="Filtro">
              <div className="grid grid-cols-3 gap-1.5">
                {FILTERS.map((f) => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`group overflow-hidden rounded-lg border text-left transition ${filter === f.id ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40"}`}>
                    <div className="relative aspect-square w-full overflow-hidden bg-black">
                      {videoUrl ? (
                        <video src={videoUrl} muted playsInline preload="metadata"
                          className="h-full w-full object-cover" style={{ filter: f.css }} />
                      ) : <div className="h-full w-full bg-secondary" />}
                      {filter === f.id && (
                        <div className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">✓</div>
                      )}
                    </div>
                    <div className={`px-1 py-1 text-[10px] font-semibold ${filter === f.id ? "text-primary" : "text-muted-foreground"}`}>{f.label}</div>
                  </button>
                ))}
              </div>
            </Tool>

            <Tool icon={aspect === "9:16" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />} title="Formato">
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => setAspect("9:16")} className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${aspect === "9:16" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>9:16 Reels</button>
                <button onClick={() => setAspect("16:9")} className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${aspect === "16:9" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>16:9 Aula</button>
              </div>
            </Tool>

            <Tool icon={<Gauge className="h-4 w-4" />} title="Velocidade">
              <div className="grid grid-cols-3 gap-1">
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${speed === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            </Tool>

            <Tool icon={<ImageIcon className="h-4 w-4" />} title="Thumbnail">
              {thumbUrl ? <img src={thumbUrl} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" /> : <div className="mb-2 grid aspect-video w-full place-items-center rounded-lg bg-secondary text-[11px] text-muted-foreground">Sem capa</div>}
              <div className="flex gap-1">
                <button onClick={captureThumb} className="flex-1 rounded-lg bg-secondary px-2 py-1.5 text-[11px] font-semibold hover:bg-secondary/80">Frame atual</button>
                <label className="flex-1 cursor-pointer rounded-lg border border-border bg-background px-2 py-1.5 text-center text-[11px] font-semibold hover:bg-secondary">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadThumbFile(e.target.files?.[0])} />
                </label>
              </div>
            </Tool>
          </aside>
        </section>
      )}

      {/* PUBLISH */}
      {step === "publish" && (
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className={`relative mx-auto w-full overflow-hidden rounded-2xl bg-black ${aspectClass}`}>
            <video src={videoUrl} controls className="h-full w-full object-cover" style={{ filter: filterCss }} />
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Detalhes da publicação</h2>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Título</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Categoria</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Dicas, Protocolos..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            {thumbUrl && (
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Capa selecionada</span>
                <img src={thumbUrl} alt="" className="aspect-video w-full rounded-lg object-cover" />
              </div>
            )}
            {uploadProgress > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Upload</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setStep("edit")} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">Voltar a editar</button>
              <button onClick={publish} disabled={publishing || !title.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Publicar
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
      {children}
    </button>
  );
}

function Tool({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items: { id: Step; label: string }[] = [
    { id: "capture", label: "Capturar" },
    { id: "edit", label: "Editar" },
    { id: "publish", label: "Publicar" },
  ];
  const idx = items.findIndex((i) => i.id === step);
  return (
    <div className="hidden items-center gap-2 md:flex">
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${i <= idx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
          <span className={`text-xs font-semibold ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{it.label}</span>
          {i < items.length - 1 && <span className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}
