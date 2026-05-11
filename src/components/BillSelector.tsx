import type { MapItem } from "@/lib/types";
import {
  getMapItemBill,
  getMapItemChamber,
  getMapItemId,
  getMapItemRollCall,
} from "@/lib/voteAggregation";

interface Props {
  items: MapItem[];
  selectedId: string;
  onChange: (id: string) => void;
}

/**
 * Tab strip. Each tab represents a MapItem — either a roll call (vote
 * tally + phase label) or a cosponsorship-only bill (cosponsor count).
 * Chamber is shown subtly so users can tell at a glance whether the
 * tab will swap them to the senate map.
 */
export const BillSelector = ({ items, selectedId, onChange }: Props) => {
  return (
    <div className="bill-selector">
      <div className="bill-selector__tabs" role="tablist">
        {items.map((item) => {
          const id = getMapItemId(item);
          const bill = getMapItemBill(item);
          const chamber = getMapItemChamber(item);
          const rc = getMapItemRollCall(item);
          const active = id === selectedId;

          const phase = rc
            ? rc.committee
              ? `${chamber} committee · ${rc.date}`
              : `${chamber} floor · ${rc.date}`
            : `${chamber} · cosponsors only`;

          const cosponsorCount =
            item.kind === "cosponsorOnly"
              ? item.cosponsorship.cosponsors.length + 1
              : 0;
          const tally = rc
            ? `${rc.totals.yea}–${rc.totals.nay}${
                rc.totals.notVoting > 0 ? ` (${rc.totals.notVoting} NV)` : ""
              }`
            : `${cosponsorCount} sponsor${cosponsorCount === 1 ? "" : "s"}`;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`bill-selector__tab${active ? " is-active" : ""}`}
              onClick={() => onChange(id)}
            >
              <span className="bill-selector__bill">{bill.label}</span>
              <span className="bill-selector__phase">{phase}</span>
              <span className="bill-selector__title">{bill.shortTitle}</span>
              <span className="bill-selector__totals">{tally}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
