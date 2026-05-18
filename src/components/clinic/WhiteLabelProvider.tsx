import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClinicBrand {
  id: string | null;
  name: string;
  doctorName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
}

const defaultBrand: ClinicBrand = {
  id: null,
  name: "Solaris",
  doctorName: "Dr. Especialista",
  logoUrl: null,
  bannerUrl: null,
  primary: "#1B8A7A",
  primaryDark: "#0D4F47",
  primaryLight: "#E1F5F2",
  accent: "#0A1628",
};

const Ctx = createContext<{
  brand: ClinicBrand;
  setBrand: (b: Partial<ClinicBrand>) => void;
  loadByClinicId: (id: string) => Promise<void>;
  loadByAccessCode: (code: string) => Promise<ClinicBrand | null>;
}>({
  brand: defaultBrand,
  setBrand: () => {},
  loadByClinicId: async () => {},
  loadByAccessCode: async () => null,
});

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function applyToDom(b: ClinicBrand) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--clinic-primary", b.primary);
  root.style.setProperty("--clinic-primary-dark", b.primaryDark);
  root.style.setProperty("--clinic-primary-light", b.primaryLight);
  root.style.setProperty("--clinic-primary-rgb", hexToRgb(b.primary));
  root.style.setProperty("--clinic-accent", b.accent);
}

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<ClinicBrand>(defaultBrand);

  useEffect(() => {
    applyToDom(brand);
  }, [brand]);

  const setBrand = (patch: Partial<ClinicBrand>) =>
    setBrandState((prev) => ({ ...prev, ...patch }));

  const loadByClinicId = async (id: string) => {
    const { data } = await supabase.from("clinics").select("*").eq("id", id).single();
    if (data) {
      setBrandState({
        id: data.id,
        name: data.name,
        doctorName: data.doctor_name,
        logoUrl: data.logo_url,
        bannerUrl: data.profile_banner_url,
        primary: data.brand_color_primary ?? "#1B8A7A",
        primaryDark: data.brand_color_dark ?? "#0D4F47",
        primaryLight: data.brand_color_light ?? "#E1F5F2",
        accent: data.brand_color_accent ?? "#0A1628",
      });
    }
  };

  const loadByAccessCode = async (code: string) => {
    const { data } = await supabase
      .from("clinics")
      .select("*")
      .eq("access_code", code.toUpperCase())
      .maybeSingle();
    if (!data) return null;
    const next: ClinicBrand = {
      id: data.id,
      name: data.name,
      doctorName: data.doctor_name,
      logoUrl: data.logo_url,
      bannerUrl: data.profile_banner_url,
      primary: data.brand_color_primary ?? "#1B8A7A",
      primaryDark: data.brand_color_dark ?? "#0D4F47",
      primaryLight: data.brand_color_light ?? "#E1F5F2",
      accent: data.brand_color_accent ?? "#0A1628",
    };
    setBrandState(next);
    return next;
  };

  return (
    <Ctx.Provider value={{ brand, setBrand, loadByClinicId, loadByAccessCode }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWhiteLabel = () => useContext(Ctx);
