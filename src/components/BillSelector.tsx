import type { RollCall } from "@/lib/types";

interface Props {
  rollCalls: RollCall[];
  selectedId: string;
  onChange: (id: string) => void;
}

export const BillSelector = ({ rollCalls, selectedId, onChange }: Props) => {
  return (
    <div className="bill-selector">
      <div className="bill-selector__tabs" role="tablist">
        {rollCalls.map((rc) => {
          const active = rc.id === selectedId;
          return (
            <button
              key={rc.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`bill-selector__tab${active ? " is-active" : ""}`}
              onClick={() => onChange(rc.id)}
            >
              <span className="bill-selector__bill">{rc.bill.label}</span>
              <span className="bill-selector__title">
                {rc.bill.shortTitle}
              </span>
              <span className="bill-selector__totals">
                {rc.totals.yea}–{rc.totals.nay}
                {rc.totals.notVoting > 0 && ` (${rc.totals.notVoting} NV)`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
