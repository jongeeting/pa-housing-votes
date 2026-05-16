/// <reference types="astro/client" />

// Build-time constant injected by Vite (see astro.config.mjs). Used as
// a `?v=` cache-buster on /data/*.geojson URLs so every new deploy
// forces clients to fetch fresh data instead of replaying a stale
// browser cache.
declare const __BUILD_ID__: string;
