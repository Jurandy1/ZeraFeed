// @lovable.dev/vite-tanstack-config already includes TanStack Start, React, Tailwind,
// path aliases and Nitro. Do not duplicate those plugins here.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
