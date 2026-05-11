import { useState } from "react";
import type { Chamber, MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";

interface Props {
  /** Which chamber's choropleth is active. House when no item is selected. */
  activeChamber: Chamber;
  /** Whether there's an active MapItem (drives heatmap availability). */
  hasActiveItem: boolean;
  showCounties: boolean;
  onShowCountiesChange: (v: boolean) => void;
  showMunis: boolean;
  onShowMunisChange: (v: boolean) => void;
  highlightClasses: Set<MunicipalClass>;
  onHighlightClassesChange: (next: Set<MunicipalClass>) => void;
  showHouseLines: boolean;
  onShowHouseLinesChange: (v: boolean) => void;
  showSenateLines: boolean;
  onShowSenateLinesChange: (v: boolean) => void;
  showNestedSupport: boolean;
  onShowNestedSupportChange: (v: boolean) => void;
}

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
 * Collapsible map controls.
 *
 *  - Overlay toggles: counties, munis, and per-chamber district lines.
 *    In bill view modes only the "other chamber" toggle is shown
 *    (the active chamber's own lines are already drawn). In explore
 *    mode both house and senate toggles are exposed.
 *  - Highlight muni classes for the political "where are the 1st-class
 *    townships?" story.
 *  - Nested-support heatmap when viewing a House bill: senate districts
 *    get a tinted overlay scaled to the % of nested House delegation
 *    that voted Yea (or cosponsored, for cosponsor-only senate items).
 */
export const LayerPanel = ({
  activeChamber,
  hasActiveItem,
  showCounties,
  onShowCountiesChange,
  showMunis,
  onShowMunisChange,
  highlightClasses,
  onHighlightClassesChange,
  showHouseLines,
  onShowHouseLinesChange,
  showSenateLines,
  onShowSenateLinesChange,
  showNestedSupport,
  onShowNestedSupportChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  const toggleClass = (cls: MunicipalClass) => {
    const next = new Set(highlightClasses);
    if (next.has(cls)) next.delete(cls);
    else next.add(cls);
    onHighlightClassesChange(next);
    if (!showMunis && next.size > 0) onShowMunisChange(true);
  };

  // When there's an active bill, only the "other" chamber toggle is
  // meaningful — the active chamber's own outlines come from the
  // choropleth itself. In explore mode (no bill), expose both.
  const showHouseLinesToggle = !hasActiveItem || activeChamber === "Senate";
  const showSenateLinesToggle = !hasActiveItem || activeChamber === "House";

  // Heatmap only makes sense when viewing a House bill (no Senate
  // roll-call data yet exists for the reverse direction).
  const heatmapAvailable = hasActiveItem && activeChamber === "House";

  return (
    <div className={`layer-panel${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="layer-panel__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Layers {open ? "▴" : "▾"}
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
                checked={showMunis}
                onChange={(e) => onShowMunisChange(e.target.checked)}
              />
              Municipal lines
            </label>
            {showHouseLinesToggle && (
              <label className="layer-panel__row">
                <input
                  type="checkbox"
                  checked={showHouseLines}
                  onChange={(e) => onShowHouseLinesChange(e.target.checked)}
                />
                House district lines
              </label>
            )}
            {showSenateLinesToggle && (
              <label className="layer-panel__row">
                <input
                  type="checkbox"
                  checked={showSenateLines}
                  onChange={(e) => onShowSenateLinesChange(e.target.checked)}
                />
                Senate district lines
              </label>
            )}
          </div>

          {activeChamber === "House" && hasActiveItem && (
            <div className="layer-panel__group">
              <div className="layer-panel__group-title">Senate nesting</div>
              <label
                className={`layer-panel__row${
                  heatmapAvailable ? "" : " is-disabled"
                }`}
                title="Tint each Senate district by the share of its nested House delegation that supports the active bill."
              >
                <input
                  type="checkbox"
                  checked={showNestedSupport}
                  disabled={!heatmapAvailable}
                  onChange={(e) => {
                    onShowNestedSupportChange(e.target.checked);
                    if (e.target.checked && !showSenateLines) {
                      onShowSenateLinesChange(true);
                    }
                  }}
                />
                Color SD by nested support
              </label>
            </div>
          )}

          <div className="layer-panel__group">
            <div className="layer-panel__group-title">Highlight muni class</div>
            {CLASSES_IN_DISPLAY_ORDER.map((cls) => (
              <label key={cls} className="layer-panel__row">
                <input
                  type="checkbox"
                  checked={highlightClasses.has(cls)}
                  onChange={() => toggleClass(cls)}
                />
                {MUNICIPAL_CLASS_LABELS[cls]}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
