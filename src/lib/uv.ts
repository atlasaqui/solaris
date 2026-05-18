// UV + weather via Open-Meteo (no API key required)
// Docs: https://open-meteo.com/

export interface UVData {
  uvIndex: number;
  temperature: number;
  city: string;
  lat: number;
  lng: number;
}

export interface UVLevel {
  label: string;
  color: string;
  pct: number;
  advice: string;
}

export function uvLevel(idx: number): UVLevel {
  if (idx <= 2)
    return {
      label: "Baixo",
      color: "#16A34A",
      pct: 18,
      advice: "Você pode ficar ao ar livre com segurança.",
    };
  if (idx <= 5)
    return {
      label: "Moderado",
      color: "#EAB308",
      pct: 42,
      advice: "Use FPS 30+ e procure sombra ao meio-dia.",
    };
  if (idx <= 7)
    return {
      label: "Alto",
      color: "#F97316",
      pct: 68,
      advice: "Reaplique FPS 50+ a cada 2h. Use chapéu.",
    };
  if (idx <= 10)
    return {
      label: "Muito alto",
      color: "#EF4444",
      pct: 88,
      advice: "Evite exposição entre 10h e 16h. FPS 50+.",
    };
  return {
    label: "Extremo",
    color: "#7C3AED",
    pct: 100,
    advice: "Risco extremo. Evite sol direto.",
  };
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalização não disponível"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

async function reverseCity(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&language=pt&count=1`,
    );
    const j = await r.json();
    return j?.results?.[0]?.name ?? "Sua região";
  } catch {
    return "Sua região";
  }
}

export async function fetchUV(): Promise<UVData> {
  let lat = -8.0476;
  let lng = -34.877;
  let city = "Recife";

  try {
    const pos = await getPosition();
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
    city = await reverseCity(lat, lng);
  } catch {
    // fallback default
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,uv_index&timezone=auto`;
  const res = await fetch(url);
  const j = await res.json();

  return {
    uvIndex: Math.round(j?.current?.uv_index ?? 0),
    temperature: Math.round(j?.current?.temperature_2m ?? 0),
    city,
    lat,
    lng,
  };
}
