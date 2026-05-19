import type { ExpressionSpecification } from "maplibre-gl";

export type MetricKey =
  | "permits"
  | "popchange"
  | "medianHomeValue"
  | "rentBurden";

/**
 * Sequential color ramps tuned to convey "low" → "high" with one
 * neutral midpoint. We deliberately pick 5 stops + a "no data"
 * fallback rather than a smooth gradient, so the legend stays
 * legible and the visual buckets are interpretable at a glance.
 *
 * Ramps come from ColorBrewer's "YlGnBu" (good for cool sequential)
 * and "OrRd" (good when high = bad/burden). PopChange uses a
 * diverging ramp (shrinking → growing) because zero is meaningful.
 */
const RAMP_YLGNBU = ["#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0"];
const RAMP_ORRD = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
const RAMP_DIVERGING_POP = [
  "#b2182b", // strong loss
  "#ef8a62", // mild loss
  "#f7f7f7", // ~stable
  "#67a9cf", // mild growth
  "#2166ac", // strong growth
];
const NO_DATA = "#e5e7eb";

interface LegendSwatch {
  color: string;
  label: string;
}

interface MetricLegend {
  swatches: LegendSwatch[];
  lowLabel: string;
  highLabel: string;
}

interface MetricDef {
  key: MetricKey;
  label: string;
  shortLabel: string;
  /** GeoJSON property name on each muni feature. */
  field: string;
  /** Compose a MapLibre `case`/`step` paint expression that maps the
   *  metric value to a color. Buckets are tuned per metric. */
  toFillExpression: () => ExpressionSpecification;
  legend: MetricLegend;
  /** One-line description shown under the selector. */
  blurb: string;
}

/** Helper: build a `step` expression. Returns NO_DATA when the field
 * is null. Steps array: [color0, t1, color1, t2, color2, ...]. */
const stepExpr = (
  field: string,
  ramp: string[],
  thresholds: number[],
): ExpressionSpecification => {
  // [step, value, color0, t1, color1, t2, color2, ...]
  const stepArgs: (string | number)[] = [];
  stepArgs.push(ramp[0]);
  for (let i = 0; i < thresholds.length; i++) {
    stepArgs.push(thresholds[i], ramp[i + 1] ?? ramp[ramp.length - 1]);
  }
  return [
    "case",
    ["==", ["get", field], null],
    NO_DATA,
    [
      "step",
      ["to-number", ["get", field], -9999],
      ...stepArgs,
    ],
  ] as unknown as ExpressionSpecification;
};

export const METRICS: Record<MetricKey, MetricDef> = {
  permits: {
    key: "permits",
    label: "Permits per 1k residents/yr (2020-2024)",
    shortLabel: "Permits",
    field: "permitsPer1kPerYear",
    blurb:
      "Annual residential building permits per 1,000 residents, averaged across 2020–2024. Higher = building more housing relative to population.",
    toFillExpression: () =>
      stepExpr("permitsPer1kPerYear", RAMP_YLGNBU, [0.5, 2, 5, 10]),
    legend: {
      swatches: [
        { color: RAMP_YLGNBU[0], label: "< 0.5" },
        { color: RAMP_YLGNBU[1], label: "0.5 – 2" },
        { color: RAMP_YLGNBU[2], label: "2 – 5" },
        { color: RAMP_YLGNBU[3], label: "5 – 10" },
        { color: RAMP_YLGNBU[4], label: "10+" },
      ],
      lowLabel: "Few permits",
      highLabel: "Many permits",
    },
  },
  popchange: {
    key: "popchange",
    label: "Population change 2020 → 2024 (%)",
    shortLabel: "Pop change",
    field: "popChange2020to2024Pct",
    blurb:
      "Percent change in total population from 2020 (Decennial) to 2024 (Census PEP). Red = lost population, blue = gained.",
    toFillExpression: () =>
      stepExpr("popChange2020to2024Pct", RAMP_DIVERGING_POP, [-3, -1, 1, 3]),
    legend: {
      swatches: [
        { color: RAMP_DIVERGING_POP[0], label: "< -3%" },
        { color: RAMP_DIVERGING_POP[1], label: "-3% to -1%" },
        { color: RAMP_DIVERGING_POP[2], label: "-1% to +1%" },
        { color: RAMP_DIVERGING_POP[3], label: "+1% to +3%" },
        { color: RAMP_DIVERGING_POP[4], label: "+3% or more" },
      ],
      lowLabel: "Shrinking",
      highLabel: "Growing",
    },
  },
  medianHomeValue: {
    key: "medianHomeValue",
    label: "Median home value (ACS 2023 5yr)",
    shortLabel: "Home value",
    field: "medianHomeValue",
    blurb:
      "ACS 2023 5-year estimate of median owner-occupied home value. Higher = pricier housing stock.",
    toFillExpression: () =>
      stepExpr(
        "medianHomeValue",
        RAMP_YLGNBU,
        [150_000, 250_000, 400_000, 600_000],
      ),
    legend: {
      swatches: [
        { color: RAMP_YLGNBU[0], label: "< $150K" },
        { color: RAMP_YLGNBU[1], label: "$150K – $250K" },
        { color: RAMP_YLGNBU[2], label: "$250K – $400K" },
        { color: RAMP_YLGNBU[3], label: "$400K – $600K" },
        { color: RAMP_YLGNBU[4], label: "$600K+" },
      ],
      lowLabel: "Cheaper",
      highLabel: "Pricier",
    },
  },
  rentBurden: {
    key: "rentBurden",
    label: "Rent-burdened renters (%)",
    shortLabel: "Rent burden",
    field: "rentBurdenedPct",
    blurb:
      "Share of renting households spending 30%+ of income on gross rent (ACS 2023 5-year). Higher = more pressure to build.",
    toFillExpression: () =>
      stepExpr("rentBurdenedPct", RAMP_ORRD, [30, 40, 50, 60]),
    legend: {
      swatches: [
        { color: RAMP_ORRD[0], label: "< 30%" },
        { color: RAMP_ORRD[1], label: "30 – 40%" },
        { color: RAMP_ORRD[2], label: "40 – 50%" },
        { color: RAMP_ORRD[3], label: "50 – 60%" },
        { color: RAMP_ORRD[4], label: "60%+" },
      ],
      lowLabel: "Less burdened",
      highLabel: "More burdened",
    },
  },
};

interface Props {
  value: MetricKey;
  onChange: (key: MetricKey) => void;
  compact?: boolean;
}

/**
 * Pill-style metric switcher. Renders as a horizontal row of buttons
 * on desktop and a native <select> on compact viewports — the pill
 * row gets cramped at phone widths.
 */
export const MetricSelector = ({ value, onChange, compact = false }: Props) => {
  const keys = Object.keys(METRICS) as MetricKey[];
  const def = METRICS[value];
  if (compact) {
    return (
      <div className="metric-selector metric-selector--compact">
        <label className="metric-selector__label" htmlFor="metric-select">
          Show:
        </label>
        <select
          id="metric-select"
          className="metric-selector__select"
          value={value}
          onChange={(e) => onChange(e.target.value as MetricKey)}
        >
          {keys.map((k) => (
            <option key={k} value={k}>
              {METRICS[k].label}
            </option>
          ))}
        </select>
        <div className="metric-selector__blurb">{def.blurb}</div>
      </div>
    );
  }
  return (
    <div className="metric-selector">
      <div className="metric-selector__pills" role="tablist">
        {keys.map((k) => (
          <button
            type="button"
            key={k}
            role="tab"
            aria-selected={k === value}
            className={`metric-selector__pill${
              k === value ? " is-active" : ""
            }`}
            onClick={() => onChange(k)}
          >
            {METRICS[k].shortLabel}
          </button>
        ))}
      </div>
      <div className="metric-selector__blurb">{def.blurb}</div>
    </div>
  );
};
