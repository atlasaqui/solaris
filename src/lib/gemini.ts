export type Condition = {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  probability: number;
  level: "alta" | "media" | "baixa";
  tags: string[];
  alertText: string;
  actionText: string;
};

export type AnalysisResult = { conditions: Condition[] };

const MOCK_RESULTS: AnalysisResult = {
  conditions: [
    {
      id: "lesao-pigmentada",
      name: "Lesão Pigmentada",
      description: "Alteração por excesso de melanina",
      fullDescription:
        "A lesão pigmentada é qualquer alteração na pele caracterizada por mudança de coloração, causada por variações na distribuição de melanina produzida pelos melanócitos.",
      probability: 74,
      level: "alta",
      tags: ["Pigmentar", "Consulta urgente"],
      alertText: "Crescimento rápido detectado nas características relatadas.",
      actionText: "Consulta urgente recomendada com dermatologista.",
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
      alertText: "Bordas irregulares observadas nos sintomas informados.",
      actionText: "Monitoramento trimestral com dermatoscopia.",
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
      alertText: "Sem risco imediato identificado.",
      actionText: "Acompanhamento de rotina em consulta regular.",
    },
  ],
};

export async function analyzeSymptoms(
  symptoms: string[],
  searchText: string,
): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const list = symptoms.length > 0 ? symptoms.join(", ") : searchText;
  if (!apiKey) return MOCK_RESULTS;

  const prompt = `Você é um assistente especializado em dermatologia.
Com base nos sintomas informados pelo paciente: "${list}",
retorne APENAS um JSON válido, sem markdown, sem backticks, sem texto extra.

Formato exato:
{
  "conditions": [
    {
      "id": "string-slug-da-doenca",
      "name": "Nome da condição",
      "description": "Descrição curta em 1 frase",
      "fullDescription": "Explicação completa em 2-3 frases sobre o que é a condição",
      "probability": 74,
      "level": "alta",
      "tags": ["Tag1", "Tag2"],
      "alertText": "Descrição do alerta principal",
      "actionText": "Ação recomendada ao paciente"
    }
  ]
}

Regras:
- Retornar de 2 a 4 condições ordenadas por probabilidade decrescente
- level deve ser exatamente: "alta", "media" ou "baixa"
- probability é um número de 0 a 100
- Responder sempre em português brasileiro
- APENAS o JSON, nada mais`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
        }),
      },
    );
    if (!response.ok) return MOCK_RESULTS;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed?.conditions?.length) return MOCK_RESULTS;
    return parsed as AnalysisResult;
  } catch {
    return MOCK_RESULTS;
  }
}

export function saveAnalysis(
  result: AnalysisResult,
  selectedSymptoms: string[],
  searchText: string,
) {
  sessionStorage.setItem(
    "library-analysis",
    JSON.stringify({ result, selectedSymptoms, searchText, ts: Date.now() }),
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
