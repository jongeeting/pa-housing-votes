import { useId, useMemo, useState } from "react";
import type { Chamber, Member } from "@/lib/types";
import { PA_HOUSE_MEMBERS_2025 } from "@/data/members/pa-house-2025";
import { PA_SENATE_MEMBERS_2025 } from "@/data/members/pa-senate-2025";

interface Props {
  /** Apply the picked district as the filter. */
  onSelect: (chamber: Chamber, district: string) => void;
}

// Pre-build sorted-by-number lists once. We sort by numeric district
// rather than string so "9" doesn't end up between "89" and "90".
const sortByDistrictNum = (a: Member, b: Member): number =>
  parseInt(a.district, 10) - parseInt(b.district, 10);

const HOUSE = [...PA_HOUSE_MEMBERS_2025].sort(sortByDistrictNum);
const SENATE = [...PA_SENATE_MEMBERS_2025].sort(sortByDistrictNum);

/** "190 — D Amen Brown" style label so search matches both district
 *  numbers and member names. The em-dash separator keeps it visually
 *  distinct from the district number. */
const labelFor = (m: Member, chamber: Chamber): string =>
  `${chamber === "Senate" ? "SD" : "HD"}-${m.district} — ${m.party} ${m.fullName}`;

/**
 * Searchable district picker sitting in the /housing-stats controls
 * bar. Lets users land on a district without coming via the main map
 * or a URL param. Implemented as a chamber-toggle radio + native
 * `<datalist>` autocomplete so typeahead works on both desktop and
 * mobile keyboards without a third-party combobox library.
 *
 * Matching is done by full label string, so "190", "amen", or
 * "brown" all surface HD-190 in the typeahead suggestions.
 */
export const DistrictPicker = ({ onSelect }: Props) => {
  const [chamber, setChamber] = useState<Chamber>("House");
  const [query, setQuery] = useState<string>("");
  const listId = useId();

  const members = chamber === "House" ? HOUSE : SENATE;

  const options = useMemo(() => members.map((m) => ({
    value: labelFor(m, chamber),
    member: m,
  })), [members, chamber]);

  const tryApply = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;
    // Exact match by label (selected from datalist).
    const byLabel = options.find((o) => o.value === value);
    if (byLabel) {
      onSelect(chamber, byLabel.member.district);
      setQuery("");
      return;
    }
    // Pure-number entry — "190".
    const asNum = parseInt(value, 10);
    if (!Number.isNaN(asNum)) {
      const byNum = options.find(
        (o) => parseInt(o.member.district, 10) === asNum,
      );
      if (byNum) {
        onSelect(chamber, byNum.member.district);
        setQuery("");
        return;
      }
    }
    // Fuzzy lookup by member-name substring — picks the first hit
    // alphabetically.
    const lower = value.toLowerCase();
    const byName = options.find(
      (o) =>
        o.member.fullName.toLowerCase().includes(lower) ||
        o.member.lastName.toLowerCase().includes(lower),
    );
    if (byName) {
      onSelect(chamber, byName.member.district);
      setQuery("");
    }
  };

  return (
    <div className="district-picker">
      <div className="district-picker__chamber" role="radiogroup" aria-label="Chamber">
        {(["House", "Senate"] as Chamber[]).map((c) => (
          <button
            type="button"
            key={c}
            role="radio"
            aria-checked={chamber === c}
            className={`district-picker__chamber-btn${
              chamber === c ? " is-active" : ""
            }`}
            onClick={() => setChamber(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="district-picker__input"
        list={listId}
        placeholder={
          chamber === "House"
            ? "Pick HD by number or name…"
            : "Pick SD by number or name…"
        }
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          // If the user picked an exact suggestion from the datalist
          // (browsers dispatch a change event with the selected value),
          // apply it immediately.
          const exact = options.find((o) => o.value === v);
          if (exact) {
            onSelect(chamber, exact.member.district);
            setQuery("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            tryApply(query);
          }
        }}
        aria-label={`Pick a ${chamber === "House" ? "House" : "Senate"} district`}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.member.id} value={o.value} />
        ))}
      </datalist>
    </div>
  );
};
