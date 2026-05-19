import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMediaQuery } from "@/lib/useMediaQuery";
import { getMemberByDistrict } from "@/data/members";
import type { Chamber } from "@/lib/types";
import { MetricSelector, type MetricKey, METRICS } from "./MetricSelector";
import {
  MuniDetailPopup,
  type MuniDetailData,
  type NestedDistrictEntry,
} from "./MuniDetailPopup";

interface DistrictFilter {
  chamber: Chamber;
  district: string;
}

/** Read the initial filter off the URL: ?house=190 or ?senate=8. Falls
 *  back to null. Only runs once on mount; subsequent state changes go
 *  through history.replaceState so the URL stays bookmarkable. */
const readFilterFromUrl = (): DistrictFilter | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const h = params.get("house");
  if (h) return { chamber: "House", district: h.replace(/^0+/, "") || h };
  const s = params.get("senate");
  if (s) return { chamber: "Senate", district: s.replace(/^0+/, "") || s };
  return null;
};

const writeFilterToUrl = (filter: DistrictFilter | null): void => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("house");
  url.searchParams.delete("senate");
  if (filter) {
    url.searchParams.set(
      filter.chamber === "House" ? "house" : "senate",
      filter.district,
    );
  }
  window.history.replaceState(null, "", url.toString());
};

// GeoJSON properties come back as primitives or already-JSON-parsed
// objects/arrays — but MapLibre re-serializes nested structures into
// strings in some pathways. Defensive parser used for nested* fields.
const parseDistrictList = (raw: unknown): NestedDistrictEntry[] => {
  if (Array.isArray(raw)) return raw as NestedDistrictEntry[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as NestedDistrictEntry[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

interface Props {
  munisUrl?: string;
  countiesUrl?: string;
}

// Per-build cache-buster, mirroring VoteMap's approach. See
// astro.config.mjs for the __BUILD_ID__ source.
const BUILD_QS =
  typeof __BUILD_ID__ === "string" ? `?v=${__BUILD_ID__}` : "";

const DEFAULT_MUNIS_URL = `/data/pa_municipalities.geojson${BUILD_QS}`;
const DEFAULT_COUNTIES_URL = `/data/pa_counties.geojson${BUILD_QS}`;

const PA_BOUNDS: [[number, number], [number, number]] = [
  [-80.6, 39.6],
  [-74.6, 42.4],
];

/**
 * Municipal-level housing-stats map. Whereas the main VoteMap is
 * choropleth-by-legislator-vote on legislative-district polygons,
 * this map is choropleth-by-housing-metric on muni polygons.
 *
 * Same MapLibre + GeoJSON foundation, but a deliberately simpler
 * control surface — one metric selector, optional county-line overlay,
 * click for the muni detail popup. No bill data, no chamber switching,
 * no nesting heatmap. Touch tooltips suppressed; the muni *is* the
 * clickable surface.
 */
export const StatsMap = ({
  munisUrl = DEFAULT_MUNIS_URL,
  countiesUrl = DEFAULT_COUNTIES_URL,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [metric, setMetric] = useState<MetricKey>("permits");
  const [showCounties, setShowCounties] = useState(true);
  const [selectedMuni, setSelectedMuni] = useState<MuniDetailData | null>(null);
  const isCompact = useMediaQuery("(max-width: 720px)");
  // Filter state: when active, dims munis whose nestedHouseDistricts /
  // nestedSenateDistricts don't include the selected district. Lifted
  // from the URL on mount and persisted back as the user clicks
  // around (so a filtered view is bookmarkable / shareable).
  const [filter, setFilter] = useState<DistrictFilter | null>(() =>
    readFilterFromUrl(),
  );
  // Parallel copy of the muni geojson features used to compute which
  // muni geoids match the current filter. MapLibre has its own copy
  // for rendering but doesn't expose `data` as the raw feature array
  // synchronously. Loading once on mount via fetch (cache-hit on the
  // muni source) keeps things simple.
  const [muniFeatures, setMuniFeatures] = useState<
    Array<{ properties: Record<string, unknown> }>
  >([]);
  useEffect(() => {
    let cancelled = false;
    fetch(munisUrl)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setMuniFeatures(j.features ?? []);
      })
      .catch(() => {
        /* leaves filter inert if fetch fails — visualization keeps working */
      });
    return () => {
      cancelled = true;
    };
  }, [munisUrl]);

  // Compute the matching muni geoids for the active filter. Empty
  // array means no filter is applied (every muni renders full opacity).
  const matchingGeoids = useMemo<string[]>(() => {
    if (!filter || muniFeatures.length === 0) return [];
    const key =
      filter.chamber === "House"
        ? "nestedHouseDistricts"
        : "nestedSenateDistricts";
    const out: string[] = [];
    for (const f of muniFeatures) {
      const raw = f.properties?.[key];
      let entries: NestedDistrictEntry[] = [];
      if (Array.isArray(raw)) entries = raw as NestedDistrictEntry[];
      else if (typeof raw === "string") {
        try {
          entries = JSON.parse(raw) as NestedDistrictEntry[];
        } catch {
          entries = [];
        }
      }
      if (entries.some((e) => e.district === filter.district)) {
        out.push(String(f.properties?.geoid ?? ""));
      }
    }
    return out;
  }, [filter, muniFeatures]);

  // Initial map setup — runs once. We attach all layers up front; the
  // active metric just swaps the paint expression on the fill layer.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs:
          "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f4f4f5" },
          },
        ],
      },
      bounds: PA_BOUNDS,
      fitBoundsOptions: { padding: 14 },
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          "Census TIGER/LINE 2024 · ACS 2023 5-year · Census BPS 2020-2024 · OpenDataPhilly · WPRDC",
      }),
    );

    map.on("load", () => {
      map.addSource("munis", { type: "geojson", data: munisUrl });
      map.addSource("counties", { type: "geojson", data: countiesUrl });

      map.addLayer({
        id: "munis-fill",
        type: "fill",
        source: "munis",
        paint: {
          // Initial paint is the "permits" ramp; updated by the
          // useEffect below whenever `metric` changes.
          "fill-color": METRICS.permits.toFillExpression(),
          // Updated by a downstream effect when the active filter
          // changes — see the matchingGeoids effect below.
          "fill-opacity": 0.78,
          "fill-outline-color": "rgba(15, 23, 42, 0.18)",
        },
      });

      map.addLayer({
        id: "munis-outline",
        type: "line",
        source: "munis",
        paint: {
          "line-color": "rgba(15, 23, 42, 0.18)",
          "line-width": 0.4,
        },
      });

      map.addLayer({
        id: "counties-outline",
        type: "line",
        source: "counties",
        layout: { visibility: showCounties ? "visible" : "none" },
        paint: {
          "line-color": "rgba(15, 23, 42, 0.5)",
          "line-width": 1,
        },
      });

      map.addLayer({
        id: "munis-selected",
        type: "line",
        source: "munis",
        paint: {
          "line-color": "#0f172a",
          "line-width": 2.5,
        },
        filter: ["==", ["get", "geoid"], "__none__"],
      });

      map.on("click", "munis-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties ?? {};
        const numOrNull = (v: unknown): number | null =>
          v === null || v === undefined || v === "" ? null : Number(v);
        setSelectedMuni({
          geoid: String(p.geoid ?? ""),
          name: String(p.name ?? ""),
          classCode: String(p.classCode ?? "other"),
          countyName: String(p.countyName ?? ""),
          population: Number(p.population ?? 0),
          landAreaSqMi: Number(p.landAreaSqMi ?? 0),
          populationDensity: Number(p.populationDensity ?? 0),
          medianIncome: numOrNull(p.medianIncome),
          medianHomeValue: numOrNull(p.medianHomeValue),
          rentBurdenedPct: numOrNull(p.rentBurdenedPct),
          ownerBurdenedPct: numOrNull(p.ownerBurdenedPct),
          permitsPer1kPerYear: numOrNull(p.permitsPer1kPerYear),
          popChange2020to2024Pct: numOrNull(p.popChange2020to2024Pct),
          nestedHouseDistricts: parseDistrictList(p.nestedHouseDistricts),
          nestedSenateDistricts: parseDistrictList(p.nestedSenateDistricts),
        });
        map.setFilter("munis-selected", ["==", ["get", "geoid"], String(p.geoid ?? "")]);
      });
      map.on("mouseenter", "munis-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "munis-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [munisUrl, countiesUrl]);

  // Repaint when metric changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer("munis-fill")) return;
    map.setPaintProperty(
      "munis-fill",
      "fill-color",
      METRICS[metric].toFillExpression(),
    );
  }, [metric, mapReady]);

  // Toggle county lines.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("counties-outline")) {
      map.setLayoutProperty(
        "counties-outline",
        "visibility",
        showCounties ? "visible" : "none",
      );
    }
  }, [showCounties, mapReady]);

  // Dim munis outside the active filter. When no filter is set, all
  // munis render at 0.78 opacity; with a filter we keep matching
  // munis at 0.85 (slightly brighter, to feel "spotlit") and drop
  // everything else to 0.12 — visible enough to read the choropleth
  // as context but unmistakably out of the selected district.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer("munis-fill")) return;
    if (!filter) {
      map.setPaintProperty("munis-fill", "fill-opacity", 0.78);
      return;
    }
    map.setPaintProperty("munis-fill", "fill-opacity", [
      "case",
      ["in", ["get", "geoid"], ["literal", matchingGeoids]],
      0.85,
      0.12,
    ] as unknown as maplibregl.ExpressionSpecification);
  }, [filter, matchingGeoids, mapReady]);

  // Push filter changes back into the URL so reload preserves state.
  useEffect(() => {
    writeFilterToUrl(filter);
  }, [filter]);

  const filterMember = useMemo(() => {
    if (!filter) return null;
    return getMemberByDistrict(filter.chamber, filter.district);
  }, [filter]);

  const legend = useMemo(() => METRICS[metric].legend, [metric]);

  return (
    <div className="stats-map">
      <div className="stats-map__controls">
        <MetricSelector value={metric} onChange={setMetric} compact={isCompact} />
        <label className="stats-map__counties-toggle">
          <input
            type="checkbox"
            checked={showCounties}
            onChange={(e) => setShowCounties(e.target.checked)}
          />
          County lines
        </label>
      </div>
      {filter && (
        <div className="stats-map__filter-chip" role="status" aria-live="polite">
          <span className="stats-map__filter-chip-label">
            Filtered to{" "}
            <strong>
              {filter.chamber === "Senate" ? "SD" : "HD"}-{filter.district}
            </strong>
            {filterMember ? (
              <>
                {" — "}
                <span
                  className={`popup__party popup__party--${filterMember.party.toLowerCase()}`}
                >
                  {filterMember.party}
                </span>{" "}
                {filterMember.fullName}
              </>
            ) : (
              " — Vacant seat"
            )}{" "}
            <span className="stats-map__filter-chip-count">
              ({matchingGeoids.length} muni
              {matchingGeoids.length === 1 ? "" : "s"})
            </span>
          </span>
          <button
            type="button"
            className="stats-map__filter-chip-clear"
            onClick={() => setFilter(null)}
            aria-label="Clear district filter"
          >
            Clear ×
          </button>
        </div>
      )}
      <div className="stats-map__canvas-wrap">
        <div ref={containerRef} className="stats-map__canvas" />
        <div className="stats-map__legend">
          <div className="stats-map__legend-title">{METRICS[metric].label}</div>
          <div className="stats-map__legend-ramp">
            {legend.swatches.map((s) => (
              <span
                key={s.color}
                className="stats-map__legend-swatch"
                style={{ background: s.color }}
                title={s.label}
              />
            ))}
          </div>
          <div className="stats-map__legend-scale">
            <span>{legend.lowLabel}</span>
            <span>{legend.highLabel}</span>
          </div>
        </div>
        {selectedMuni && (
          <MuniDetailPopup
            data={selectedMuni}
            onApplyDistrictFilter={(chamber, district) => {
              setFilter({ chamber, district });
            }}
            onClose={() => {
              setSelectedMuni(null);
              const map = mapRef.current;
              if (map?.getLayer("munis-selected")) {
                map.setFilter("munis-selected", [
                  "==",
                  ["get", "geoid"],
                  "__none__",
                ]);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
