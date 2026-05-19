import { useEffect, useState } from "react";

/**
 * Reactive CSS media-query hook. Returns true when the query currently
 * matches and re-renders the consuming component on change. SSR-safe:
 * returns `false` during server rendering (which is fine for our use
 * since the VoteMap is client-only).
 *
 * Usage:
 *   const isMobile = useMediaQuery("(max-width: 720px)");
 *   const isTouch = useMediaQuery("(hover: none)");
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (ev: MediaQueryListEvent) => setMatches(ev.matches);
    // Sync once in case the initial state was wrong (rare, but covers
    // hydration races).
    setMatches(mql.matches);
    // Modern browsers expose addEventListener; very old Safari only
    // exposed the deprecated addListener API. Both call signatures
    // accept the same listener function.
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
};
