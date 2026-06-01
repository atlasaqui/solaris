import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Phone, Globe, Instagram, MessageCircle, Award, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import bannerPlaceholder from "@/assets/solaris/screen-10-clinic-home/clinic-banner-placeholder.png";
import dotOn from "@/assets/solaris/screen-10-clinic-home/pagination-dots-on.png";
import dotOff from "@/assets/solaris/screen-10-clinic-home/pagination-dots-off.png";

export const Route = createFileRoute("/app/clinic-profile")({
  head: () => ({ meta: [{ title: "Sua clínica" }] }),
  component: ClinicProfile,
});

type Clinic = {
  name: string; doctor_name: string; specialty: string | null; profile_tagline: string | null;
  profile_description: string | null; profile_address: string | null; profile_city: string | null;
  profile_state: string | null; profile_phone: string | null; profile_whatsapp: string | null;
  profile_website: string | null; profile_instagram: string | null; profile_crm: string | null;
  profile_banner_url: string | null; logo_url: string | null; years_experience: number | null;
};

function ClinicProfile() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) { setLoading(false); return; }
      const { data } = await supabase.from("clinics").select("*").eq("id", pt.clinic_id).single();
      setClinic(data as Clinic | null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!clinic) return <div className="text-muted-foreground">Clínica não encontrada.</div>;

  return (
    <article className="-mx-5 -mt-5 space-y-5 pb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="relative w-full overflow-hidden">
        <img
          src={clinic.profile_banner_url ?? bannerPlaceholder}
          alt=""
          className="h-44 w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
          <img src={dotOn} alt="" className="h-2" />
          <img src={dotOff} alt="" className="h-2" />
          <img src={dotOff} alt="" className="h-2" />
        </div>
        <div className="absolute -bottom-8 left-5">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-lg ring-4 ring-white">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              : <span className="font-display text-2xl font-bold" style={{ color: "var(--clinic-primary)" }}>{clinic.name.slice(0, 2).toUpperCase()}</span>}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-8">
        <header>
          <h1 className="font-display text-[22px] font-semibold leading-tight">{clinic.name}</h1>
          <p className="text-[14px] text-muted-foreground">{clinic.doctor_name}{clinic.specialty ? ` · ${clinic.specialty}` : ""}</p>
          {clinic.profile_tagline && <p className="mt-2 text-[14px]" style={{ color: "var(--clinic-primary-dark)" }}>{clinic.profile_tagline}</p>}
        </header>

        {(clinic.profile_crm || clinic.years_experience) && (
          <div className="flex gap-2">
            {clinic.profile_crm && <Badge>CRM {clinic.profile_crm}</Badge>}
            {clinic.years_experience && <Badge><Award className="mr-1 inline h-3 w-3" />{clinic.years_experience} anos</Badge>}
          </div>
        )}

        {clinic.profile_description && (
          <section>
            <h2 className="mb-2 font-display text-[16px] font-semibold">Sobre</h2>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{clinic.profile_description}</p>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="font-display text-[16px] font-semibold">Contato</h2>
          {clinic.profile_address && <Row icon={MapPin} text={`${clinic.profile_address}${clinic.profile_city ? `, ${clinic.profile_city}` : ""}${clinic.profile_state ? ` - ${clinic.profile_state}` : ""}`} />}
          {clinic.profile_phone && <Row icon={Phone} text={clinic.profile_phone} href={`tel:${clinic.profile_phone}`} />}
          {clinic.profile_whatsapp && <Row icon={MessageCircle} text={`WhatsApp · ${clinic.profile_whatsapp}`} href={`https://wa.me/${clinic.profile_whatsapp.replace(/\D/g, "")}`} />}
          {clinic.profile_website && <Row icon={Globe} text={clinic.profile_website} href={clinic.profile_website} />}
          {clinic.profile_instagram && <Row icon={Instagram} text={clinic.profile_instagram} href={`https://instagram.com/${clinic.profile_instagram.replace("@", "")}`} />}
        </section>
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>{children}</span>;
}
function Row({ icon: Icon, text, href }: { icon: typeof MapPin; text: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--clinic-primary)" }} />
      <span className="truncate text-[13px]">{text}</span>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer" className="block">{inner}</a> : inner;
}
