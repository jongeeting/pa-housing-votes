import type { RollCall } from "@/lib/types";
import { SB1346 } from "@/data/bills/all-bills";

/**
 * Senate Urban Affairs & Housing committee — July 12, 2026.
 *
 * SB 1346 (Rothman, ADU) reported as committed 10-1.
 * The one Nay: Sen. Farry (R). Bipartisan Yea coalition of
 * 6 R (Argall, Coleman, Keefer, Picozzi (Chair), Vogel,
 * Ward ex-officio) + 4 D (Fontana, Miller, Saval, Street).
 *
 * Source: palegis.us committee rollcallid=997
 *   https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=997&sessYr=2025&sessInd=0
 * Parsed via pipeline/scripts/fetch_rollcall.py --committee-code 35
 *   --committee-rc-id 997.
 * Data lives at pipeline/data/rollcalls/2025-senate-cmte35-rc997.json.
 */
export const ROLL_CALL_SB1346_SUAH: RollCall = {
  id: "2026-07-12-senate-suah-sb1346-reported",
  date: "2026-07-12",
  chamber: "Senate",
  committee: "Urban Affairs and Housing",
  bill: SB1346,
  motion: "That SB 1346 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 10, nay: 1, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=997&sessYr=2025&sessInd=0",
  votes: [
    // Democrats — 4 Yea, 0 Nay
    { memberId: "senate-2025-wayne-d-fontana", vote: "Yea" },
    { memberId: "senate-2025-nick-miller", vote: "Yea" },
    { memberId: "senate-2025-nikil-saval", vote: "Yea" },
    { memberId: "senate-2025-sharif-street", vote: "Yea" },

    // Republicans — 6 Yea, 1 Nay
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Yea" },
    { memberId: "senate-2025-frank-a-farry", vote: "Nay" },
    { memberId: "senate-2025-dawn-w-keefer", vote: "Yea" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
  ],
};
