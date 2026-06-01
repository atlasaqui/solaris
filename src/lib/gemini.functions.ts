import { createServerFn } from "@tanstack/react-start";

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

export const analyzeSymptomsFn = createServerFn({ method: "POST" })
  .inputValidator((input: { symptoms: string[]; searchText: string }) => input)
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    const list = data.symptoms.length > 0 ? data.symptoms.join(", ") : data.searchText;
    if (!apiKey || !list.trim()) return MOCK_RESULTS;

    const prompt = `Você é um assistente médico especializado em dermatologia clínica.
O paciente relatou os seguintes sintomas: "${list}".

Analise e retorne APENAS um JSON válido, sem markdown, sem backticks, sem texto extra.

Formato exato:
{
  "conditions": [
    {
      "id": "slug-sem-espacos",
      "name": "Nome clínico",
      "description": "Uma frase curta",
      "fullDescription": "Explicação completa em 2-3 frases sobre o que é, causas e características",
      "probability": 74,
      "level": "alta",
      "tags": ["Tag1", "Tag2"],
      "alertText": "Principal sinal de alerta",
      "actionText": "Ação recomendada"
    }
  ]
}

Regras:
- 2 a 4 condições, ordenadas por probabilidade decrescente
- level: exatamente "alta" (>60), "media" (30-60) ou "baixa" (<30)
- probability: inteiro 0-100
- tags: 1 a 3 itens curtos
- Português brasileiro
- APENAS o JSON puro`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1200, topP: 0.8, topK: 40 },
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);
      if (!res.ok) {
        console.error("[Solaris] Gemini HTTP", res.status);
        return MOCK_RESULTS;
      }
      const json = await res.json();
      const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean) as AnalysisResult;
      if (!parsed?.conditions?.length) return MOCK_RESULTS;
      return parsed;
    } catch (e) {
      clearTimeout(timeout);
      console.error("[Solaris] Gemini error", e);
      return MOCK_RESULTS;
    }
  });
