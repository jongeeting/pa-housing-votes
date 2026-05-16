import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Per-build identifier injected into the client bundle as
// __BUILD_ID__. We append it as a `?v=` query string to /data/*
// URLs so every new deploy forces MapLibre to bypass any stale
// browser-cached copy of the GeoJSONs. The data filenames themselves
// stay stable (Netlify's filename-hash trick only applies to JS/CSS
// that pass through the build pipeline). Without this, a returning
// visitor whose browser cached yesterday's pa_house_districts.geojson
// can keep seeing yesterday's per-district numbers indefinitely.
const BUILD_ID = String(Date.now());

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: "https://pa-housing-votes.netlify.app",
  vite: {
    ssr: {
      noExternal: ["maplibre-gl"],
    },
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
  },
});
