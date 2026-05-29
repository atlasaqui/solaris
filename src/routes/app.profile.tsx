import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, UserCog, Lock, Settings, User as UserIcon, X, Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Perfil" }] }),
  component: Page,
});

type Patient = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function Page() {
  const nav = useNavigate();
  const [p, setP] = useState<Patient | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, email, phone, city, state, avatar_url")
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (data) setP(data as Patient);
  };

  useEffect(() => { load(); }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth/login" });
  };

  const first = (p?.full_name ?? "Paciente").split(" ")[0];

  return (
    <>
      <PatientHeader title="Perfil" />
      <div className="px-4 py-6 pb-24">
        <div className="grid place-items-center">
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt={p.full_name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full text-[28px] font-bold text-white"
                 style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))" }}>
              {initials(p?.full_name ?? "")}
            </div>
          )}
          <div className="mt-3 text-[18px] font-bold" style={{ color: "var(--clinic-primary)" }}>Olá, {first}</div>
          {p?.email && <div className="text-[13px]" style={{ color: "var(--text-medium)" }}>{p.email}</div>}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl bg-white">
          <Row icon={Bell}    label="Notificações"            bg="#DCFCE7" color="#16A34A" onClick={() => toast.message("Notificações em breve")} />
          <Row icon={UserCog} label="Informações de conta"    bg="#F3F4F6" color="#4B5563" onClick={() => setEditOpen(true)} />
          <Row icon={Lock}    label="Segurança"               bg="#DBEAFE" color="#2563EB" onClick={() => toast.message("Em breve")} />
          <Row icon={Settings} label="Configurações"          bg="#EDE9FE" color="#7C3AED" onClick={() => toast.message("Em breve")} />
        </div>

        <button onClick={signOut} className="mt-8 w-full rounded-xl border-2 bg-white py-3 text-[15px] font-bold" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
          Sair da conta
        </button>
      </div>

      {editOpen && p && (
        <EditSheet patient={p} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />
      )}
    </>
  );
}

function Row({ icon: Icon, label, bg, color, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left last:border-b-0 transition active:bg-gray-50">
      <div className="grid h-10 w-10 place-items-center rounded-full" style={{ background: bg }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1 text-[15px] font-semibold" style={{ color: "var(--text-dark)" }}>{label}</div>
      <span className="text-gray-400">›</span>
    </button>
  );
}

function EditSheet({ patient, onClose, onSaved }: { patient: Patient; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: patient.full_name ?? "",
    phone: patient.phone ?? "",
    city: patient.city ?? "",
    state: patient.state ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.full_name.trim()) { toast.error("Nome é obrigatório"); return; }
    setBusy(true);
    const { error } = await supabase.from("patients").update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
    }).eq("id", patient.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados atualizados");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="w-full rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold" style={{ color: "var(--text-dark)" }}>Informações de conta</h2>
          <button onClick={onClose} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-full bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Nome completo" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(00) 00000-0000" />
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <Field label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v.toUpperCase().slice(0, 2) })} />
          </div>
        </div>
        <button onClick={save} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))", boxShadow: "0 4px 16px rgba(var(--clinic-primary-rgb),0.35)" }}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--text-medium)" }}>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-white px-4 py-3 text-[14px] outline-none focus:border-[var(--clinic-primary)]"
        style={{ borderColor: "#E5E7EB" }} />
    </label>
  );
}
