import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMediaQuery } from "@/lib/useMediaQuery";
import { MetricSelector, type MetricKey, METRICS } from "./MetricSelector";
import { MuniDetailPopup, type MuniDetailData } from "./MuniDetailPopup";

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
