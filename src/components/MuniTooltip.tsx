import type { MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";

export interface MuniTooltipData {
  name: string;
  classCode: MunicipalClass;
  countyName: string;
  population: number;
  landAreaSqMi: number;
  populationDensity: number;
  medianIncome: number | null;
  medianHomeValue: number | null;
  rentBurdenedPct: number | null;
  ownerBurdenedPct: number | null;
  permitsPer1kPerYear: number | null;
}

interface Props {
  /** Pixel position relative to the canvas-wrap container. */
  x: number;
  y: number;
  data: MuniTooltipData;
}

const intFmt = new Intl.NumberFormat("en-US");
const fmt = (n: number) => intFmt.format(n);

/**
 * Compact currency formatter: $385K, $1.2M, $90K.
 * Used for medians where the magnitude matters more than the cents.
 */
const fmtUSD = (n: number | null): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

const fmtPct = (n: number | null): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : `${Math.round(n)}%`;

const fmtRate = (n: number | null): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : n.toFixed(1);

/**
 * Municipalities for which we have parcel-level permit data that the
 * district popups expose at much finer resolution than the muni tooltip
 * possibly can. The muni-wide rate is technically accurate but
 * misleadingly uniform (every hover inside Philly's polygon would
 * show 5.2/1k/yr), so we hide the permit row in the tooltip and point
 * the user to click a district instead. Matched on (name, county)
 * to avoid catching the tiny "New Philadelphia" borough in Schuylkill.
 */
const PARCEL_MUNI_KEYS = new Set<string>([
  "Philadelphia|Philadelphia",
  "Pittsburgh|Allegheny",
]);

const isParcelDataMuni = (name: string, countyName: string): boolean =>
  PARCEL_MUNI_KEYS.has(`${name}|${countyName}`);

/**
 * Tiny floating tooltip that follows the cursor when the muni layer is
 * visible. Shows the muni's name, class, county, headline demographics
 * (population / area / density) plus housing-affordability signals
 * (permits / rent-burdened / home value). Pointer-events: none so the
 * cursor still hits the map.
 */
export const MuniTooltip = ({ x, y, data }: Props) => {
  const classLabel =
    MUNICIPAL_CLASS_LABELS[data.classCode] ?? data.classCode;
  const isParcelMuni = isParcelDataMuni(data.name, data.countyName);
  const hasHousingFacts =
    (!isParcelMuni && data.permitsPer1kPerYear !== null) ||
    data.rentBurdenedPct !== null ||
    data.medianHomeValue !== null;
  return (
    <div
      className="muni-tooltip"
      style={{
        transform: `translate(${x + 14}px, ${y + 14}px)`,
      }}
      role="status"
      aria-live="polite"
    >
      <div className="muni-tooltip__name">{data.name}</div>
      <div className="muni-tooltip__meta">
        {classLabel} · {data.countyName} County
      </div>
      <div className="muni-tooltip__stats">
        <span>{fmt(data.population)} people</span>
        <span aria-hidden="true">·</span>
        <span>{data.landAreaSqMi.toFixed(1)} mi²</span>
        <span aria-hidden="true">·</span>
        <span>{fmt(data.populationDensity)}/mi²</span>
      </div>
      {hasHousingFacts && (
        <div className="muni-tooltip__stats muni-tooltip__stats--housing">
          {!isParcelMuni && (
            <>
              <span>Permitted {fmtRate(data.permitsPer1kPerYear)} units/1k/yr</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{fmtPct(data.rentBurdenedPct)} rent-burdened</span>
          <span aria-hidden="true">·</span>
          <span>{fmtUSD(data.medianHomeValue)} median home</span>
        </div>
      )}
      {isParcelMuni && (
        <div className="muni-tooltip__note">
          Permits vary a lot by district — click for breakdown
        </div>
      )}
    </div>
  );
};
