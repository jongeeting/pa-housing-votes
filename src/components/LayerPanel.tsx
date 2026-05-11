import { useState } from "react";
import type { MunicipalClass } from "@/lib/types";
import { MUNICIPAL_CLASS_LABELS } from "@/lib/types";

interface Props {
  showCounties: boolean;
  onShowCountiesChange: (v: boolean) => void;
  showMunis: boolean;
  onShowMunisChange: (v: boolean) => void;
  highlightClasses: Set<MunicipalClass>;
  onHighlightClassesChange: (next: Set<MunicipalClass>) => void;
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
 * Collapsible map controls. Overlays (county lines, muni lines) are
 * always available; the muni-class highlights only matter when muni
 * lines are on, but we leave them clickable even when munis are off
 * since checking a class is a natural way to "show me where these are."
 */
export const LayerPanel = ({
  showCounties,
  onShowCountiesChange,
  showMunis,
  onShowMunisChange,
  highlightClasses,
  onHighlightClassesChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  const toggleClass = (cls: MunicipalClass) => {
    const next = new Set(highlightClasses);
    if (next.has(cls)) next.delete(cls);
    else next.add(cls);
    onHighlightClassesChange(next);
    // Auto-enable muni layer when the user starts highlighting classes —
    // otherwise the checkbox does nothing visible.
    if (!showMunis && next.size > 0) onShowMunisChange(true);
  };

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
          </div>
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
