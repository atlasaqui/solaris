// Pure utilities — safe to import on client and server.

export type ProgressLevel = "none" | "mild" | "moderate" | "great" | "excellent";

export type LevelInfo = {
  index: number; // 1..5
  key: "seedling" | "sprout" | "blossom" | "sparkle" | "trophy";
  label: string;
  emoji: string;
  color: string; // hex
  min: number;
  max: number;
};

export const LEVELS: LevelInfo[] = [
  { index: 1, key: "seedling", label: "Início",          emoji: "🌱", color: "#94A3B8", min: 0,  max: 19  },
  { index: 2, key: "sprout",   label: "Melhora Leve",    emoji: "🌿", color: "#86EFAC", min: 20, max: 39  },
  { index: 3, key: "blossom",  label: "Melhora Moderada",emoji: "🌸", color: "#2DD4BF", min: 40, max: 69  },
  { index: 4, key: "sparkle",  label: "Melhora Ótima",   emoji: "✨", color: "#F59E0B", min: 70, max: 89  },
  { index: 5, key: "trophy",   label: "Transformação",   emoji: "🏆", color: "#EAB308", min: 90, max: 100 },
];

export function computeLevel(score: number): LevelInfo {
  const s = Math.max(0, Math.min(100, score || 0));
  return LEVELS.find((l) => s >= l.min && s <= l.max) ?? LEVELS[0];
}

export const PROGRESS_LEVEL_META: Record<ProgressLevel, { label: string; emoji: string; color: string; points: number }> = {
  none:      { label: "Sem melhora",      emoji: "🔴", color: "#EF4444", points: 0  },
  mild:      { label: "Melhora Leve",     emoji: "🟡", color: "#F59E0B", points: 10 },
  moderate:  { label: "Melhora Moderada", emoji: "🟢", color: "#10B981", points: 20 },
  great:     { label: "Melhora Ótima",    emoji: "⭐", color: "#F59E0B", points: 35 },
  excellent: { label: "Excelente",        emoji: "🏆", color: "#EAB308", points: 50 },
};

export type AchievementKey =
  | "first_photo"
  | "streak_4"
  | "streak_8"
  | "first_improvement"
  | "moderate_improvement"
  | "great_improvement"
  | "transformation"
  | "sun_protection_7"
  | "treatment_complete";

export const ACHIEVEMENTS: Record<
  AchievementKey,
  { label: string; emoji: string; description: string }
> = {
  first_photo:          { label: "Primeira foto",     emoji: "📸", description: "Enviou a foto da semana 1" },
  streak_4:             { label: "Sequência de 4",    emoji: "🔥", description: "4 semanas consecutivas" },
  streak_8:             { label: "Sequência de 8",    emoji: "💎", description: "Completou todas as semanas" },
  first_improvement:    { label: "Primeira melhora",  emoji: "🌱", description: "Score acima de 0" },
  moderate_improvement: { label: "Melhora Moderada",  emoji: "🟢", description: "Score acima de 40" },
  great_improvement:    { label: "Melhora Ótima",     emoji: "⭐", description: "Score acima de 70" },
  transformation:       { label: "Transformação",     emoji: "🏆", description: "Score acima de 90" },
  sun_protection_7:     { label: "Proteção solar",    emoji: "☀️", description: "7 dias seguidos com proteção" },
  treatment_complete:   { label: "Tratamento completo", emoji: "👑", description: "Tratamento finalizado" },
};
