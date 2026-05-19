import { useState } from "react";
import type { MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";

interface Props {
  showCounties: boolean;
  onShowCountiesChange: (v: boolean) => void;
  highlightedClasses: Set<MunicipalClass>;
  onHighlightedClassesChange: (next: Set<MunicipalClass>) => void;
  showHouseLines: boolean;
  onShowHouseLinesChange: (v: boolean) => void;
  showSenateLines: boolean;
  onShowSenateLinesChange: (v: boolean) => void;
  isCompact?: boolean;
}

// Order matches what the main map uses so users see a familiar list
// when they bounce between maps.
const CLASSES_IN_DISPLAY_ORDER: MunicipalClass[] = [
  "first_class_city",
  "second_class_city",
  "second_class_a_city",
  "third_class_city",
  "borough",
  "first_class_township",
  "second_class_township",
  "town",
];

/**
 * Collapsible filter panel overlaid on the /housing-stats map canvas.
 *
 * Two filter groups:
 *
 * - **Muni class** — when one or more classes are checked, munis NOT
 *   in those classes get dimmed (combined with the district filter
 *   if one is active). Useful for "show me only 1st-class townships"
 *   style questions — those are the older 1970s-suburban-boom tier
 *   that often resists new construction.
 *
 * - **District lines** — house and senate district outlines can be
 *   layered on top of the muni choropleth for spatial reference,
 *   independent of any active district filter.
 *
 * Position + collapse behavior matches the main map's LayerPanel so
 * the two maps feel consistent. Compact viewport collapses the
 * muni-class list behind a sub-disclosure (same pattern as
 * LayerPanel) since the eight checkboxes dominate on phone widths.
 */
export const StatsFilterPanel = ({
  showCounties,
  onShowCountiesChange,
  highlightedClasses,
  onHighlightedClassesChange,
  showHouseLines,
  onShowHouseLinesChange,
  showSenateLines,
  onShowSenateLinesChange,
  isCompact = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(!isCompact);

  const toggleClass = (cls: MunicipalClass) => {
    const next = new Set(highlightedClasses);
    if (next.has(cls)) next.delete(cls);
    else next.add(cls);
    onHighlightedClassesChange(next);
  };

  // Count non-default overlay/filter states so the closed panel shows
  // a small badge ("how many things have I changed?"). County lines
  // default ON, so we only count them as "active" when toggled OFF.
  const activeBadge =
    highlightedClasses.size +
    (showHouseLines ? 1 : 0) +
    (showSenateLines ? 1 : 0) +
    (showCounties ? 0 : 1);

  return (
    <div className={`layer-panel${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="layer-panel__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Layers & filters
        {activeBadge > 0 && (
          <span className="layer-panel__active-badge">{activeBadge}</span>
        )}{" "}
        {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="layer-panel__body">
          <div className="layer-panel__group">
            <div className="layer-panel__group-title">Overlays</div>
            <label className="layer-panel__row">
              <input
                type="checkbox"
                checked={showCounties}
                onChange={(e) => onShowCountiesChange(e.target.checked)}
              />
              County lines
            </label>
            <label className="layer-panel__row">
              <input
                type="checkbox"
                checked={showHouseLines}
                onChange={(e) => onShowHouseLinesChange(e.target.checked)}
              />
              House district lines
            </label>
            <label className="layer-panel__row">
              <input
                type="checkbox"
                checked={showSenateLines}
                onChange={(e) => onShowSenateLinesChange(e.target.checked)}
              />
              Senate district lines
            </label>
          </div>

          <div className="layer-panel__group">
            {isCompact ? (
              <button
                type="button"
                className="layer-panel__subtoggle"
                onClick={() => setClassOpen((v) => !v)}
                aria-expanded={classOpen}
              >
                <span className="layer-panel__group-title">
                  Filter by muni class
                </span>
                <span className="layer-panel__subtoggle-chevron">
                  {classOpen ? "▴" : "▾"}
                </span>
              </button>
            ) : (
              <div className="layer-panel__group-title">
                Filter by muni class
              </div>
            )}
            {classOpen && (
              <>
                {CLASSES_IN_DISPLAY_ORDER.map((cls) => (
                  <label key={cls} className="layer-panel__row">
                    <input
                      type="checkbox"
                      checked={highlightedClasses.has(cls)}
                      onChange={() => toggleClass(cls)}
                    />
                    {MUNICIPAL_CLASS_LABELS[cls]}
                  </label>
                ))}
                {highlightedClasses.size > 0 && (
                  <button
                    type="button"
                    className="layer-panel__clear-link"
                    onClick={() => onHighlightedClassesChange(new Set())}
                  >
                    Clear muni-class filter
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
