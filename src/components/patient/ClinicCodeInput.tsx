import { useState } from "react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

interface Props {
  onValid: (clinicId: string) => void;
}

export function ClinicCodeInput({ onValid }: Props) {
  const { loadByAccessCode } = useWhiteLabel();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const full = code.startsWith("SLR-") ? code : `SLR-${code.replace(/^SLR-?/i, "")}`;
    const clinic = await loadByAccessCode(full.toUpperCase());
    setLoading(false);
    if (!clinic?.id) {
      setError("Código não encontrado. Verifique com seu médico.");
      return;
    }
    try {
      localStorage.setItem("solaris.clinic_id", clinic.id);
      localStorage.setItem("solaris.clinic_code", full.toUpperCase());
    } catch {}
    onValid(clinic.id);
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-5 w-full" style={{ fontFamily: "Nunito, sans-serif" }}>
      <input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Informe o código da clínica aqui."
        className="text-center text-[14px] outline-none bg-white"
        style={{
          width: 270,
          height: 53,
          border: "2px solid var(--clinic-primary)",
          borderRadius: 15,
          color: "var(--text-dark)",
        }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="text-white font-medium text-[16px] disabled:opacity-60"
        style={{
          width: 200,
          height: 47,
          background: "var(--clinic-primary)",
          borderRadius: 15,
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        {loading ? "Verificando..." : "Confirmar"}
      </button>
    </form>
  );
}
