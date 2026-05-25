import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  cloudflare: false,
  plugins: command === "build" ? [nitro({ preset: "vercel" })] : [],
}));
