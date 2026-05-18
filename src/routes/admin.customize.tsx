import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Palette, Save, Loader2, Upload, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/admin/customize")({
  head: () => ({ meta: [{ title: "Personalização — Solaris" }] }),
  component: AdminCustomize,
});

interface BrandForm {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  logoUrl: string | null;
  bannerUrl: string | null;
}

const PRESETS: { name: string; primary: string; dark: string; light: string; accent: string }[] = [
  { name: "Teal Solaris", primary: "#1B8A7A", dark: "#0D4F47", light: "#E1F5F2", accent: "#0A1628" },
  { name: "Rosé Clínico", primary: "#C44569", dark: "#7B2D44", light: "#FAE3EA", accent: "#1E1E2E" },
  { name: "Azul Royal", primary: "#2563EB", dark: "#1E3A8A", light: "#DBEAFE", accent: "#0F172A" },
  { name: "Esmeralda", primary: "#10B981", dark: "#064E3B", light: "#D1FAE5", accent: "#111827" },
  { name: "Ametista", primary: "#7C3AED", dark: "#4C1D95", light: "#EDE9FE", accent: "#1E1B4B" },
  { name: "Âmbar Pro", primary: "#D97706", dark: "#92400E", light: "#FEF3C7", accent: "#1C1917" },
];

function hexLighten(hex: string, amount = 0.85): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}
function hexDarken(hex: string, amount = 0.45): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const mix = (v: number) => Math.round(v * (1 - amount));
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

function AdminCustomize() {
  const { setBrand, loadByClinicId } = useWhiteLabel();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandForm>({
    primary: "#1B8A7A", primaryDark: "#0D4F47", primaryLight: "#E1F5F2",
    accent: "#0A1628", logoUrl: null, bannerUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!doc?.clinic_id) { setLoading(false); return; }
      const { data: c } = await supabase.from("clinics").select("*").eq("id", doc.clinic_id).single();
      if (c) {
        setClinicId(c.id);
        setForm({
          primary: c.brand_color_primary ?? "#1B8A7A",
          primaryDark: c.brand_color_dark ?? "#0D4F47",
          primaryLight: c.brand_color_light ?? "#E1F5F2",
          accent: c.brand_color_accent ?? "#0A1628",
          logoUrl: c.logo_url,
          bannerUrl: c.profile_banner_url,
        });
      }
      setLoading(false);
    })();
  }, []);

  // Live preview
  useEffect(() => {
    setBrand({
      primary: form.primary,
      primaryDark: form.primaryDark,
      primaryLight: form.primaryLight,
      accent: form.accent,
      logoUrl: form.logoUrl,
      bannerUrl: form.bannerUrl,
    });
  }, [form]);

  const applyPreset = (p: typeof PRESETS[number]) => {
    setForm((f) => ({ ...f, primary: p.primary, primaryDark: p.dark, primaryLight: p.light, accent: p.accent }));
  };

  const onPrimaryChange = (hex: string) => {
    setForm((f) => ({ ...f, primary: hex, primaryDark: hexDarken(hex), primaryLight: hexLighten(hex) }));
  };

  const upload = async (file: File, kind: "logo" | "banner") => {
    if (!clinicId) return;
    setUploading(kind);
    const bucket = kind === "logo" ? "clinic-logos" : "clinic-banners";
    const ext = file.name.split(".").pop();
    const path = `${clinicId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { toast.error("Upload falhou: " + error.message); setUploading(null); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setForm((f) => ({ ...f, [kind === "logo" ? "logoUrl" : "bannerUrl"]: data.publicUrl }));
    setUploading(null);
    toast.success(kind === "logo" ? "Logo enviado" : "Banner enviado");
  };

  const save = async () => {
    if (!clinicId) return;
    setSaving(true);
    const { error } = await supabase.from("clinics").update({
      brand_color_primary: form.primary,
      brand_color_dark: form.primaryDark,
      brand_color_light: form.primaryLight,
      brand_color_accent: form.accent,
      logo_url: form.logoUrl,
      profile_banner_url: form.bannerUrl,
    }).eq("id", clinicId);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Personalização aplicada");
    loadByClinicId(clinicId);
  };

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!clinicId) return <div className="text-muted-foreground">Nenhuma clínica vinculada.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: form.primaryLight, color: form.primary }}>
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Personalização White Label</h1>
            <p className="text-sm text-muted-foreground">As mudanças aparecem no app dos pacientes em tempo real</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: form.primary }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar e publicar
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Presets */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Paletas prontas</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => applyPreset(p)} className="group rounded-xl border border-border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex gap-1.5">
                    {[p.primary, p.dark, p.light, p.accent].map((c) => (
                      <span key={c} className="h-6 w-6 rounded-md ring-1 ring-black/5" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-2 text-xs font-medium">{p.name}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Custom colors */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold">Cores customizadas</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ColorField label="Primary" value={form.primary} onChange={onPrimaryChange} hint="Define dark e light automaticamente" />
              <ColorField label="Primary dark" value={form.primaryDark} onChange={(v) => setForm((f) => ({ ...f, primaryDark: v }))} />
              <ColorField label="Primary light" value={form.primaryLight} onChange={(v) => setForm((f) => ({ ...f, primaryLight: v }))} />
              <ColorField label="Accent" value={form.accent} onChange={(v) => setForm((f) => ({ ...f, accent: v }))} />
            </div>
          </section>

          {/* Uploads */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold">Identidade visual</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <UploadField label="Logo (quadrado)" url={form.logoUrl} busy={uploading === "logo"} onPick={(f) => upload(f, "logo")} aspect="square" />
              <UploadField label="Banner do perfil (3:1)" url={form.bannerUrl} busy={uploading === "banner"} onPick={(f) => upload(f, "banner")} aspect="banner" />
            </div>
          </section>
        </div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="border-b border-border bg-background/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preview em tempo real
            </div>
            <div className="p-5" style={{ background: "#FAFBFC" }}>
              <div className="overflow-hidden rounded-2xl shadow-lg">
                <div className="px-4 py-3 text-white" style={{ background: form.primary }}>
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-xs font-bold backdrop-blur">
                      {form.logoUrl ? <img src={form.logoUrl} className="h-full w-full rounded-lg object-cover" /> : "SL"}
                    </div>
                    <div className="text-sm font-semibold">Clínica</div>
                  </div>
                </div>
                <div className="space-y-3 bg-white p-4">
                  <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(160deg, ${form.primaryDark}, ${form.primary})` }}>
                    <div className="text-[10px] uppercase opacity-70">UV agora</div>
                    <div className="font-display text-3xl font-bold">7</div>
                    <div className="text-xs opacity-80">Alto</div>
                  </div>
                  <button className="w-full rounded-lg py-2.5 text-xs font-semibold text-white" style={{ background: form.primary }}>
                    Botão primário
                  </button>
                  <div className="rounded-lg p-3 text-xs" style={{ background: form.primaryLight, color: form.primaryDark }}>
                    Card de destaque
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-input bg-background p-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function UploadField({ label, url, busy, onPick, aspect }: { label: string; url: string | null; busy: boolean; onPick: (f: File) => void; aspect: "square" | "banner" }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <label className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background transition hover:border-primary ${aspect === "square" ? "aspect-square max-w-[200px]" : "aspect-[3/1]"}`}>
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="text-xs">{busy ? "Enviando..." : "Clique para enviar"}</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
          disabled={busy}
        />
      </label>
    </div>
  );
}
