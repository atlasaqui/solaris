import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, Building2, Palette, MapPin, CreditCard, Users,
  Check, ArrowRight, ArrowLeft, Loader2, Upload, Copy, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/login" });
  },
  head: () => ({ meta: [{ title: "Configuração inicial — Solaris" }] }),
  component: Onboarding,
});

type Clinic = {
  id: string;
  name: string;
  doctor_name: string;
  access_code: string;
  specialty: string | null;
  profile_crm: string | null;
  years_experience: number | null;
  profile_tagline: string | null;
  profile_city: string | null;
  profile_state: string | null;
  profile_whatsapp: string | null;
  profile_instagram: string | null;
  logo_url: string | null;
  brand_color_primary: string | null;
  onboarding_completed_at: string | null;
};

const STEPS = [
  { id: 1, label: "Sobre você", icon: Building2 },
  { id: 2, label: "Identidade", icon: Palette },
  { id: 3, label: "Contato", icon: MapPin },
  { id: 4, label: "Plano", icon: CreditCard },
  { id: 5, label: "Primeiro paciente", icon: Users },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: doc } = await supabase
        .from("doctors").select("clinic_id").eq("user_id", auth.user.id).maybeSingle();
      if (!doc?.clinic_id) {
        navigate({ to: "/auth/register-doctor" });
        return;
      }
      const { data: c } = await supabase
        .from("clinics").select("*").eq("id", doc.clinic_id).maybeSingle();
      if (c) setClinic(c as Clinic);
      setLoading(false);
    })();
  }, []);

  const update = (patch: Partial<Clinic>) =>
    setClinic((c) => (c ? { ...c, ...patch } : c));

  const save = async (patch: Partial<Clinic>, nextStep?: number) => {
    if (!clinic) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("clinics").update(patch).eq("id", clinic.id);
      if (error) throw error;
      update(patch);
      if (nextStep) setStep(nextStep);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    await save({ onboarding_completed_at: new Date().toISOString() });
    toast.success("Tudo pronto! Bem-vindo ao Solaris.");
    navigate({ to: "/admin/dashboard" });
  };

  if (loading || !clinic) {
    return (
      <div className="grid min-h-screen place-items-center bg-night text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night text-white">
      <div className="mx-auto flex max-w-3xl flex-col px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">S</div>
          <span className="font-display text-xl font-bold">Solaris</span>
          <span className="ml-auto text-xs text-white/40">Etapa {step} de {STEPS.length}</span>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-medium transition ${
                    done ? "border-primary bg-primary text-primary-foreground"
                    : active ? "border-primary bg-primary/20 text-primary"
                    : "border-white/15 text-white/40"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 ${done ? "bg-primary" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          {step === 1 && <Step1 clinic={clinic} onChange={update} onNext={() => save({
            specialty: clinic.specialty, profile_crm: clinic.profile_crm,
            years_experience: clinic.years_experience, profile_tagline: clinic.profile_tagline,
          }, 2)} saving={saving} />}
          {step === 2 && <Step2 clinic={clinic} onChange={update} onSave={save} onNext={() => setStep(3)} saving={saving} />}
          {step === 3 && <Step3 clinic={clinic} onChange={update} onNext={() => save({
            profile_city: clinic.profile_city, profile_state: clinic.profile_state,
            profile_whatsapp: clinic.profile_whatsapp, profile_instagram: clinic.profile_instagram,
          }, 4)} saving={saving} />}
          {step === 4 && <Step4 onNext={() => setStep(5)} />}
          {step === 5 && <Step5 clinic={clinic} onFinish={finish} saving={saving} />}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              onClick={finish}
              className="text-xs text-white/40 hover:text-white/70 hover:underline"
            >
              Pular configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Steps ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/70">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

function PrimaryBtn({ onClick, disabled, children }: any) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
    >
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      {!disabled && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function Step1({ clinic, onChange, onNext, saving }: any) {
  return (
    <>
      <div className="mb-6 flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 text-primary" />
        <div>
          <h2 className="font-display text-2xl font-bold">Olá, Dr(a). {clinic.doctor_name.split(" ")[0]}!</h2>
          <p className="mt-1 text-sm text-white/60">Vamos personalizar sua clínica em 5 passos rápidos.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Especialidade">
          <input className={inputCls} value={clinic.specialty ?? ""}
            onChange={(e) => onChange({ specialty: e.target.value })} placeholder="Dermatologista" />
        </Field>
        <Field label="CRM">
          <input className={inputCls} value={clinic.profile_crm ?? ""}
            onChange={(e) => onChange({ profile_crm: e.target.value })} placeholder="CRM/SP 123456" />
        </Field>
        <Field label="Anos de experiência">
          <input type="number" className={inputCls} value={clinic.years_experience ?? ""}
            onChange={(e) => onChange({ years_experience: e.target.value ? Number(e.target.value) : null })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Frase de impacto (aparece no perfil)">
            <input className={inputCls} value={clinic.profile_tagline ?? ""}
              onChange={(e) => onChange({ profile_tagline: e.target.value })}
              placeholder="Cuidando da sua pele com ciência e carinho" />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <PrimaryBtn onClick={onNext} disabled={saving}>Continuar</PrimaryBtn>
      </div>
    </>
  );
}

function Step2({ clinic, onChange, onSave, onNext, saving }: any) {
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${clinic.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("clinic-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("clinic-logos").getPublicUrl(path);
      await onSave({ logo_url: data.publicUrl });
      toast.success("Logo atualizado");
    } catch (e: any) {
      toast.error(e.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-2xl font-bold">Identidade visual</h2>
      <p className="mt-1 text-sm text-white/60">Seu logo e cor principal aparecerão para todos os pacientes.</p>
      <div className="mt-6 space-y-5">
        <Field label="Logo da clínica">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {clinic.logo_url
                ? <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" />
                : <Building2 className="h-7 w-7 text-white/30" />}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm transition hover:bg-white/10">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Enviando..." : "Escolher arquivo"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          </div>
        </Field>
        <Field label="Cor principal">
          <div className="flex items-center gap-3">
            <input type="color" value={clinic.brand_color_primary ?? "#1B8A7A"}
              onChange={(e) => onChange({ brand_color_primary: e.target.value })}
              className="h-11 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
            <input className={inputCls} value={clinic.brand_color_primary ?? ""}
              onChange={(e) => onChange({ brand_color_primary: e.target.value })} />
          </div>
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <PrimaryBtn
          onClick={async () => { await onSave({ brand_color_primary: clinic.brand_color_primary }); onNext(); }}
          disabled={saving}
        >Continuar</PrimaryBtn>
      </div>
    </>
  );
}

function Step3({ clinic, onChange, onNext, saving }: any) {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Onde te encontrar</h2>
      <p className="mt-1 text-sm text-white/60">Pacientes verão essas informações no perfil público.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Cidade">
          <input className={inputCls} value={clinic.profile_city ?? ""}
            onChange={(e) => onChange({ profile_city: e.target.value })} placeholder="São Paulo" />
        </Field>
        <Field label="Estado">
          <input className={inputCls} value={clinic.profile_state ?? ""}
            onChange={(e) => onChange({ profile_state: e.target.value })} placeholder="SP" maxLength={2} />
        </Field>
        <Field label="WhatsApp">
          <input className={inputCls} value={clinic.profile_whatsapp ?? ""}
            onChange={(e) => onChange({ profile_whatsapp: e.target.value })} placeholder="11999999999" />
        </Field>
        <Field label="Instagram">
          <input className={inputCls} value={clinic.profile_instagram ?? ""}
            onChange={(e) => onChange({ profile_instagram: e.target.value })} placeholder="@suaclinica" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <PrimaryBtn onClick={onNext} disabled={saving}>Continuar</PrimaryBtn>
      </div>
    </>
  );
}

function Step4({ onNext }: any) {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Escolha seu plano</h2>
      <p className="mt-1 text-sm text-white/60">Você tem 14 dias de teste gratuito em qualquer plano.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { name: "Starter", price: "R$ 97", desc: "até 30 pacientes" },
          { name: "Pro", price: "R$ 197", desc: "até 100 pacientes", featured: true },
          { name: "Premium", price: "R$ 397", desc: "ilimitado" },
        ].map((p) => (
          <div key={p.name}
            className={`rounded-xl border p-4 ${p.featured ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"}`}
          >
            {p.featured && <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Recomendado</div>}
            <div className="font-display text-lg font-bold">{p.name}</div>
            <div className="mt-1 text-2xl font-bold">{p.price}<span className="text-xs font-normal text-white/50">/mês</span></div>
            <div className="mt-1 text-xs text-white/60">{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/admin/billing"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20">
          <CreditCard className="h-4 w-4" /> Assinar agora
          <ExternalLink className="h-3 w-3" />
        </Link>
        <button onClick={onNext}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10">
          Decidir depois <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

function Step5({ clinic, onFinish, saving }: any) {
  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/register-patient?code=${clinic.access_code}`
    : "";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <>
      <h2 className="font-display text-2xl font-bold">Convide seu primeiro paciente</h2>
      <p className="mt-1 text-sm text-white/60">Compartilhe o código ou o link de cadastro abaixo.</p>

      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
          <div className="text-xs uppercase tracking-wider text-primary/80">Código de acesso</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-wider">{clinic.access_code}</div>
          <button onClick={() => copy(clinic.access_code)}
            className="mx-auto mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
            <Copy className="h-3 w-3" /> Copiar código
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Link direto de cadastro</div>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={inviteUrl} className={inputCls + " text-xs"} />
            <button onClick={() => copy(inviteUrl)}
              className="rounded-lg bg-white/10 p-2.5 hover:bg-white/20"><Copy className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onFinish} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Finalizar e ir para o painel
        </button>
      </div>
    </>
  );
}
