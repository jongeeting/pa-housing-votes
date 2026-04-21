import type { RollCall } from "@/lib/types";

/**
 * House Housing & Urban Affairs committee — April 13, 2026.
 *
 * Two state zoning reform bills reported out of committee on the same
 * day, both by 19–7 margins but with different Republican coalitions.
 *
 *   HB 2186 — committee roll call (palegis.us rollcallid=1915)
 *   HB 2109 — committee roll call (palegis.us rollcallid=1909)
 *
 * Vote details transcribed from the official roll call summary
 * screenshots provided 2026-04-13.
 */

/* -------------------------------------------------------------------------- */
/*  HB 2186                                                                   */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2186: RollCall = {
  id: "2026-04-13-house-housing-hb2186",
  date: "2026-04-13",
  chamber: "House",
  committee: "Housing and Community Development",
  bill: {
    id: "HB2186",
    label: "HB 2186",
    session: "2025-2026",
    chamber: "House",
    shortTitle: "Accessory Dwelling Units",
    description:
      "Requires municipalities to allow accessory dwelling units (ADUs) — small secondary homes on single-family lots — statewide.",
    sourceUrl:
      "https://www.palegis.us/legislation/bills/2025/hb2186",
  },
  motion: "That House Bill 2186 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 19, nay: 7, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1915&sessYr=2025&sessInd=0",
  votes: [
    // Democrats — all Yea
    { memberId: "house-2025-markosek", vote: "Yea" },
    { memberId: "house-2025-abney", vote: "Yea" },
    { memberId: "house-2025-boyd", vote: "Yea" },
    { memberId: "house-2025-brown", vote: "Yea" },
    { memberId: "house-2025-cephas", vote: "Yea" },
    { memberId: "house-2025-green", vote: "Yea" },
    { memberId: "house-2025-krajewski", vote: "Yea" },
    { memberId: "house-2025-madsen", vote: "Yea" },
    { memberId: "house-2025-mayes", vote: "Yea" },
    { memberId: "house-2025-powell", vote: "Yea" },
    { memberId: "house-2025-probst", vote: "Yea" },
    { memberId: "house-2025-smith-wade-el", vote: "Yea" },
    { memberId: "house-2025-tiburcio", vote: "Yea" },
    { memberId: "house-2025-waxman", vote: "Yea" },
    // Republicans — 5 Yea, 7 Nay
    { memberId: "house-2025-irvin", vote: "Yea" },
    { memberId: "house-2025-bashline", vote: "Yea" },
    { memberId: "house-2025-jones", vote: "Nay" },
    { memberId: "house-2025-kephart", vote: "Yea" },
    { memberId: "house-2025-mackenzie", vote: "Nay" },
    { memberId: "house-2025-major", vote: "Yea" },
    { memberId: "house-2025-rasel", vote: "Yea" },
    { memberId: "house-2025-rossi", vote: "Nay" },
    { memberId: "house-2025-shaffer", vote: "Nay" },
    { memberId: "house-2025-twardzik", vote: "Nay" },
    { memberId: "house-2025-walsh", vote: "Nay" },
    { memberId: "house-2025-weaknecht", vote: "Nay" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  HB 2109                                                                   */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2109: RollCall = {
  id: "2026-04-13-house-housing-hb2109",
  date: "2026-04-13",
  chamber: "House",
  committee: "Housing and Community Development",
  bill: {
    id: "HB2109",
    label: "HB 2109",
    session: "2025-2026",
    chamber: "House",
    shortTitle: "Occupancy Limits Preemption",
    description:
      "Bars municipalities from capping the number of unrelated people who can live together, removing a common barrier to shared housing.",
    sourceUrl:
      "https://www.palegis.us/legislation/bills/2025/hb2109",
  },
  motion: "That House Bill 2109 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 19, nay: 7, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1909&sessYr=2025&sessInd=0",
  votes: [
    // Democrats — all Yea (same as HB 2186)
    { memberId: "house-2025-markosek", vote: "Yea" },
    { memberId: "house-2025-abney", vote: "Yea" },
    { memberId: "house-2025-boyd", vote: "Yea" },
    { memberId: "house-2025-brown", vote: "Yea" },
    { memberId: "house-2025-cephas", vote: "Yea" },
    { memberId: "house-2025-green", vote: "Yea" },
    { memberId: "house-2025-krajewski", vote: "Yea" },
    { memberId: "house-2025-madsen", vote: "Yea" },
    { memberId: "house-2025-mayes", vote: "Yea" },
    { memberId: "house-2025-powell", vote: "Yea" },
    { memberId: "house-2025-probst", vote: "Yea" },
    { memberId: "house-2025-smith-wade-el", vote: "Yea" },
    { memberId: "house-2025-tiburcio", vote: "Yea" },
    { memberId: "house-2025-waxman", vote: "Yea" },
    // Republicans — 5 Yea, 7 Nay (Rasel & Twardzik flipped vs HB 2186)
    { memberId: "house-2025-irvin", vote: "Yea" },
    { memberId: "house-2025-bashline", vote: "Yea" },
    { memberId: "house-2025-jones", vote: "Nay" },
    { memberId: "house-2025-kephart", vote: "Yea" },
    { memberId: "house-2025-mackenzie", vote: "Nay" },
    { memberId: "house-2025-major", vote: "Yea" },
    { memberId: "house-2025-rasel", vote: "Nay" }, // flipped from Yea
    { memberId: "house-2025-rossi", vote: "Nay" },
    { memberId: "house-2025-shaffer", vote: "Nay" },
    { memberId: "house-2025-twardzik", vote: "Yea" }, // flipped from Nay
    { memberId: "house-2025-walsh", vote: "Nay" },
    { memberId: "house-2025-weaknecht", vote: "Nay" },
  ],
};

export const APRIL_13_2026_ROLL_CALLS: RollCall[] = [
  ROLL_CALL_HB2186,
  ROLL_CALL_HB2109,
];
