import { useQuery } from "@tanstack/react-query";
import { fetchUV } from "@/lib/uv";

export function useUV() {
  return useQuery({
    queryKey: ["uv"],
    queryFn: fetchUV,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
