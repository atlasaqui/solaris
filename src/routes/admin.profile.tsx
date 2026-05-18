import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Perfil da Clínica" }] }),
  component: AdminProfile,
});

type ClinicForm = {
  name: string;
  doctor_name: string;
  specialty: string;
  profile_tagline: string;
  profile_description: string;
  profile_address: string;
  profile_city: string;
  profile_state: string;
  profile_phone: string;
  profile_whatsapp: string;
  profile_website: string;
  profile_instagram: string;
  profile_crm: string;
  uv_alert_message: string;
};

const empty: ClinicForm = {
  name: "", doctor_name: "", specialty: "", profile_tagline: "",
  profile_description: "", profile_address: "", profile_city: "", profile_state: "",
  profile_phone: "", profile_whatsapp: "", profile_website: "", profile_instagram: "",
  profile_crm: "", uv_alert_message: "",
};

function AdminProfile() {
  const { loadByClinicId } = useWhiteLabel();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicForm>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          name: c.name ?? "", doctor_name: c.doctor_name ?? "", specialty: c.specialty ?? "",
          profile_tagline: c.profile_tagline ?? "", profile_description: c.profile_description ?? "",
          profile_address: c.profile_address ?? "", profile_city: c.profile_city ?? "", profile_state: c.profile_state ?? "",
          profile_phone: c.profile_phone ?? "", profile_whatsapp: c.profile_whatsapp ?? "",
          profile_website: c.profile_website ?? "", profile_instagram: c.profile_instagram ?? "",
          profile_crm: c.profile_crm ?? "", uv_alert_message: c.uv_alert_message ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const update = (k: keyof ClinicForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!clinicId) return;
    setSaving(true);
    const { error } = await supabase.from("clinics").update(form).eq("id", clinicId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Perfil atualizado");
    loadByClinicId(clinicId);
  };

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!clinicId) return <div className="text-muted-foreground">Nenhuma clínica vinculada.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary"><Building2 className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Perfil da Clínica</h1>
            <p className="text-sm text-muted-foreground">Informações exibidas no app dos pacientes</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </button>
      </header>

      <Section title="Identidade">
        <Field label="Nome da clínica"><Input value={form.name} onChange={update("name")} /></Field>
        <Field label="Nome do médico"><Input value={form.doctor_name} onChange={update("doctor_name")} /></Field>
        <Field label="Especialidade"><Input value={form.specialty} onChange={update("specialty")} /></Field>
        <Field label="CRM"><Input value={form.profile_crm} onChange={update("profile_crm")} /></Field>
        <Field label="Tagline" full><Input value={form.profile_tagline} onChange={update("profile_tagline")} placeholder="Cuidados dermatológicos personalizados" /></Field>
        <Field label="Descrição" full><Textarea value={form.profile_description} onChange={update("profile_description")} rows={4} /></Field>
      </Section>

      <Section title="Contato e localização">
        <Field label="Endereço" full><Input value={form.profile_address} onChange={update("profile_address")} /></Field>
        <Field label="Cidade"><Input value={form.profile_city} onChange={update("profile_city")} /></Field>
        <Field label="Estado"><Input value={form.profile_state} onChange={update("profile_state")} /></Field>
        <Field label="Telefone"><Input value={form.profile_phone} onChange={update("profile_phone")} /></Field>
        <Field label="WhatsApp"><Input value={form.profile_whatsapp} onChange={update("profile_whatsapp")} /></Field>
        <Field label="Website"><Input value={form.profile_website} onChange={update("profile_website")} /></Field>
        <Field label="Instagram"><Input value={form.profile_instagram} onChange={update("profile_instagram")} placeholder="@suaclinica" /></Field>
      </Section>

      <Section title="Alertas UV">
        <Field label="Mensagem personalizada (até 120 caracteres)" full>
          <Textarea value={form.uv_alert_message} onChange={update("uv_alert_message")} maxLength={120} rows={3} />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="mb-5 font-display text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />;
}
