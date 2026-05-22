// @lovable.dev/vite-tanstack-config already includes Tanstack Start, React, Tailwind,
// tsConfigPaths, sandbox helpers, error loggers, etc.
// We disable the cloudflare plugin here so the build targets Vercel instead of Workers.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Disable Cloudflare Workers plugin — we deploy to Vercel.
  cloudflare: false,
  tanstackStart: {
    // Build to Vercel's Build Output API (.vercel/output)
    target: "vercel",
  },
});
