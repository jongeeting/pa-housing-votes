import type { RollCall } from "@/lib/types";
import { VOTE_COLORS, COSPONSOR_FILL, NO_VOTE_FILL, PARTY_STROKE } from "@/lib/colors";

interface Props {
  rollCall: RollCall;
}

export const Legend = ({ rollCall }: Props) => {
  return (
    <div className="legend">
      <div className="legend__title">{rollCall.bill.label} vote</div>
      <ul className="legend__list">
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
        <li>
          <span
            className="legend__swatch"
            style={{ background: COSPONSOR_FILL }}
          />
          Cosponsor
        </li>
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
