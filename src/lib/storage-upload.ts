import { supabase } from "@/integrations/supabase/client";

export async function uploadToStorageWithProgress({
  bucket,
  path,
  file,
  contentType,
  onProgress,
}: {
  bucket: string;
  path: string;
  file: Blob;
  contentType: string;
  onProgress?: (progress: number) => void;
}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/storage/v1/object/${bucket}/${encodedPath}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(readStorageError(xhr.responseText) || `Falha no upload (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Falha de rede durante o upload"));
    xhr.send(file);
  });

  onProgress?.(100);
}

function readStorageError(body: string) {
  try {
    const parsed = JSON.parse(body);
    return parsed.message || parsed.error || body;
  } catch {
    return body;
  }
}