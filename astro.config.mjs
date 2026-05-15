import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: "https://pa-housing-votes.netlify.app",
  vite: {
    ssr: {
      noExternal: ["maplibre-gl"],
    },
  },
});
