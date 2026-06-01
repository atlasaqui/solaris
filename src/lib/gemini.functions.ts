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
    const lovableKey = process.env.LOVABLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const list = data.symptoms.length > 0 ? data.symptoms.join(", ") : data.searchText;
    if (!list.trim()) return MOCK_RESULTS;

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
- 2 a 4 condições DIRETAMENTE relacionadas aos sintomas: ${list}
- Ordenadas por probabilidade decrescente
- level: exatamente "alta" (>60), "media" (30-60) ou "baixa" (<30)
- probability: inteiro 0-100
- tags: 1 a 3 itens curtos
- Português brasileiro
- APENAS o JSON puro, sem nenhum texto adicional`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const parseText = (text: string): AnalysisResult | null => {
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      try {
        const parsed = JSON.parse(clean) as AnalysisResult;
        return parsed?.conditions?.length ? parsed : null;
      } catch {
        return null;
      }
    };

    // Try 1: Lovable AI Gateway (preferred — no rate limits, no Google key needed)
    if (lovableKey) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          const text: string = json?.choices?.[0]?.message?.content ?? "";
          const parsed = parseText(text);
          if (parsed) {
            clearTimeout(timeout);
            console.log("[Solaris] Lovable AI OK", parsed.conditions.length, "condições");
            return parsed;
          }
          console.error("[Solaris] Lovable AI parse falhou:", text.substring(0, 200));
        } else {
          const body = await res.text();
          console.error("[Solaris] Lovable AI HTTP", res.status, body.substring(0, 200));
        }
      } catch (e) {
        console.error("[Solaris] Lovable AI error", e);
      }
    }

    // Try 2: Direct Gemini API (fallback)
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
            }),
            signal: controller.signal,
          },
        );
        if (res.ok) {
          const json = await res.json();
          const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          const parsed = parseText(text);
          if (parsed) {
            clearTimeout(timeout);
            console.log("[Solaris] Gemini direct OK", parsed.conditions.length, "condições");
            return parsed;
          }
        } else {
          console.error("[Solaris] Gemini HTTP", res.status);
        }
      } catch (e) {
        console.error("[Solaris] Gemini error", e);
      }
    }

    clearTimeout(timeout);
    console.warn("[Solaris] Todas as tentativas falharam, retornando MOCK");
    return MOCK_RESULTS;
  });
