import type { MapItem } from "@/lib/types";
import { VOTE_COLORS, COSPONSOR_FILL, NO_VOTE_FILL, PARTY_STROKE } from "@/lib/colors";
import { getMapItemBill, getMapItemRollCall } from "@/lib/voteAggregation";

interface Props {
  item: MapItem;
}

export const Legend = ({ item }: Props) => {
  const bill = getMapItemBill(item);
  const rc = getMapItemRollCall(item);
  return (
    <div className="legend">
      <div className="legend__title">
        {bill.label} {rc ? "vote" : "cosponsors"}
      </div>
      <ul className="legend__list">
        {rc && (
          <>
            <li>
              <span
                className="legend__swatch"
                style={{ background: VOTE_COLORS.Yea }}
              />
              Yea
            </li>
            <li>
              <span
                className="legend__swatch"
                style={{ background: VOTE_COLORS.Nay }}
              />
              Nay
            </li>
            <li>
              <span
                className="legend__swatch"
                style={{ background: VOTE_COLORS["Not Voting"] }}
              />
              Not voting / absent
            </li>
          </>
        )}
        {/* Cosponsor swatch is only relevant when there's no vote to
            show. On roll-call items, cosponsorship lives in the popup
            and the FullVoteList below the map instead of competing
            with Yea/Nay as a fill color. */}
        {!rc && (
          <li>
            <span
              className="legend__swatch"
              style={{ background: COSPONSOR_FILL }}
            />
            Cosponsor / sponsor
          </li>
        )}
        <li>
          <span
            className="legend__swatch"
            style={{ background: NO_VOTE_FILL }}
          />
          No record
        </li>
      </ul>
      <div className="legend__divider" />
      <div className="legend__subtitle">District outline = party</div>
      <ul className="legend__list">
        <li>
          <span
            className="legend__swatch legend__swatch--ring"
            style={{ borderColor: PARTY_STROKE.D }}
          />
          Democrat
        </li>
        <li>
          <span
            className="legend__swatch legend__swatch--ring"
            style={{ borderColor: PARTY_STROKE.R }}
          />
          Republican
        </li>
      </ul>
    </div>
  );
};
