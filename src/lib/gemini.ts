import { analyzeSymptomsFn, type AnalysisResult, type Condition } from "./gemini.functions";

export type { Condition, AnalysisResult };

export const FALLBACK_ANALYSIS: AnalysisResult = {
  conditions: [
    {
      id: "lesao-pigmentada",
      name: "Lesão Pigmentada",
      description: "Alteração por excesso de melanina",
      fullDescription:
        "A lesão pigmentada é qualquer alteração na pele caracterizada por mudança de coloração em relação à pele ao redor, causada por variações na quantidade ou distribuição de pigmentos — principalmente a melanina, produzida pelos melanócitos.",
      probability: 74,
      level: "alta",
      tags: ["Pigmentar", "Consulta urgente"],
      alertText: "Crescimento rápido detectado",
      actionText: "Consulta urgente recomendada",
    },
    {
      id: "nevo-atipico",
      name: "Nevo Atípico",
      description: "Pinta com características irregulares",
      fullDescription:
        "O nevo atípico é uma pinta com bordas irregulares e coloração variada que requer monitoramento regular por dermatologista.",
      probability: 52,
      level: "media",
      tags: ["Benigno", "Monitoramento"],
      alertText: "Bordas irregulares observadas",
      actionText: "Monitoramento trimestral",
    },
    {
      id: "dermatofibroma",
      name: "Dermatofibroma",
      description: "Tumor benigno do tecido conectivo",
      fullDescription:
        "O dermatofibroma é um nódulo benigno e firme que geralmente aparece nas pernas e não representa risco à saúde.",
      probability: 26,
      level: "baixa",
      tags: ["Benigno", "Comum"],
      alertText: "Sem risco imediato identificado",
      actionText: "Acompanhamento de rotina anual",
    },
  ],
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "condicao";
}

function normalizeLevel(value: unknown, probability: number): Condition["level"] {
  if (value === "alta" || value === "media" || value === "baixa") return value;
  if (probability > 60) return "alta";
  if (probability >= 30) return "media";
  return "baixa";
}

function normalizeAnalysis(raw: unknown): AnalysisResult {
  const maybe = raw as Partial<AnalysisResult> | null;
  if (!maybe?.conditions || !Array.isArray(maybe.conditions) || maybe.conditions.length === 0) {
    return FALLBACK_ANALYSIS;
  }

  const conditions = maybe.conditions.slice(0, 4).map((condition, index) => {
    const source = condition as Partial<Condition>;
    const name = String(source.name || FALLBACK_ANALYSIS.conditions[index]?.name || "Condição dermatológica");
    const probability = Math.max(0, Math.min(100, Number(source.probability ?? FALLBACK_ANALYSIS.conditions[index]?.probability ?? 35)));
    return {
      id: slugify(String(source.id || name)),
      name,
      description: String(source.description || "Possível condição relacionada aos sintomas informados"),
      fullDescription: String(source.fullDescription || source.description || "Condição sugerida a partir dos sintomas descritos, sem avaliação médica ou envio de foto."),
      probability,
      level: normalizeLevel(source.level, probability),
      tags: Array.isArray(source.tags) && source.tags.length > 0 ? source.tags.map(String).slice(0, 3) : ["Orientativo"],
      alertText: String(source.alertText || "Observe mudanças de tamanho, cor, borda ou sintomas persistentes."),
      actionText: String(source.actionText || "Consulte um dermatologista para avaliação adequada."),
    } satisfies Condition;
  });

  return { conditions };
}

export async function analyzeSymptoms(
  symptoms: string[],
  searchText: string,
): Promise<AnalysisResult> {
  try {
    const result = await analyzeSymptomsFn({ data: { symptoms, searchText } });
    return normalizeAnalysis(result);
  } catch (error) {
    console.error("[Solaris] análise indisponível, usando fallback", error);
    return FALLBACK_ANALYSIS;
  }
}

export function saveAnalysis(
  result: AnalysisResult,
  selectedSymptoms: string[],
  searchText: string,
) {
  const normalized = normalizeAnalysis(result);
  sessionStorage.setItem(
    "library-analysis",
    JSON.stringify({ result: normalized, selectedSymptoms, searchText, ts: Date.now() }),
  );
}

export function loadAnalysis(): {
  result: AnalysisResult;
  selectedSymptoms: string[];
  searchText: string;
} | null {
  try {
    const raw = sessionStorage.getItem("library-analysis");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
