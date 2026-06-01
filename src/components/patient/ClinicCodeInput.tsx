import { useState } from "react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import iconClinic from "@/assets/solaris/screen-04-clinic-code/icon-clinic.png";
import btnConfirm from "@/assets/solaris/screen-04-clinic-code/btn-primary-confirm-code.png";
import inputBg from "@/assets/solaris/screen-04-clinic-code/input-clinic-code.png";
import dots from "@/assets/solaris/screen-04-clinic-code/pagination-dots-3.png";
import hint from "@/assets/solaris/screen-04-clinic-code/text-clinic-code-hint.png";

interface Props {
  onValid: (clinicId: string) => void;
  onBack?: () => void;
}

export function ClinicCodeInput({ onValid, onBack }: Props) {
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
    <form onSubmit={submit} className="flex w-full flex-col items-center gap-6">
      <img src={iconClinic} alt="" className="w-[88px]" />
      <img src={hint} alt="Insira o código da sua clínica" className="w-[280px] max-w-full" />

      <div className="relative w-full max-w-[300px]">
        <img src={inputBg} alt="" className="pointer-events-none w-full" draggable={false} />
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SLR-XXXXX"
          className="absolute inset-0 m-auto h-[80%] w-[90%] bg-transparent text-center text-[15px] font-semibold outline-none"
          style={{ color: "var(--text-dark)" }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="transition active:scale-95 disabled:opacity-60"
        aria-label="Confirmar"
      >
        <img src={btnConfirm} alt={loading ? "Verificando..." : "Confirmar"} className="w-[220px]" draggable={false} />
      </button>

      <img src={dots} alt="" className="mt-2 h-3" />

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold"
          style={{ color: "var(--clinic-primary)" }}
        >
          ← Voltar
        </button>
      )}
    </form>
  );
}
