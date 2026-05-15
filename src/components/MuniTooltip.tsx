import type { MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";

export interface MuniTooltipData {
  name: string;
  classCode: MunicipalClass;
  countyName: string;
  population: number;
  landAreaSqMi: number;
  populationDensity: number;
}

interface Props {
  /** Pixel position relative to the canvas-wrap container. */
  x: number;
  y: number;
  data: MuniTooltipData;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

/**
 * Tiny floating tooltip that follows the cursor when the muni layer is
 * visible. Shows the muni's name, class, county, population, density,
 * and area. Pointer-events: none so the cursor still hits the map.
 */
export const MuniTooltip = ({ x, y, data }: Props) => {
  const classLabel =
    MUNICIPAL_CLASS_LABELS[data.classCode] ?? data.classCode;
  return (
    <div
      className="muni-tooltip"
      style={{
        // Offset slightly so the cursor doesn't sit ON the tooltip.
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
    </div>
  );
};
