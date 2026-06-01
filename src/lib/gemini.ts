import { analyzeSymptomsFn, type AnalysisResult, type Condition } from "./gemini.functions";

export type { Condition, AnalysisResult };

export async function analyzeSymptoms(
  symptoms: string[],
  searchText: string,
): Promise<AnalysisResult> {
  return await analyzeSymptomsFn({ data: { symptoms, searchText } });
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
