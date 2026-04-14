import type { RollCall } from "@/lib/types";

/**
 * House Housing & Urban Affairs committee — April 14, 2025.
 *
 * Two state zoning reform bills reported out of committee on the same
 * day, both by 19–7 margins but with different Republican coalitions.
 *
 *   HB 2186 — committee roll call (palegis.us rollcallid TBD)
 *   HB 2109 — committee roll call (palegis.us rollcallid TBD)
 *
 * !!  ACTION REQUIRED  !!
 * The two source URLs below are intentionally set to whichever
 * rollcallid we *guessed* — we still need to confirm which palegis.us
 * rollcallid corresponds to which bill. Update the `sourceUrl` and
 * `bill.sourceUrl` fields below once confirmed.
 *
 * Vote details transcribed from the official roll call summary
 * screenshots provided 2025-04-14.
 */

/* -------------------------------------------------------------------------- */
/*  HB 2186                                                                   */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2186: RollCall = {
  id: "2025-04-14-house-housing-hb2186",
  date: "2025-04-14",
  chamber: "House",
  committee: "Housing and Urban Affairs",
  bill: {
    id: "HB2186",
    label: "HB 2186",
    session: "2025-2026",
    chamber: "House",
    shortTitle: "TODO: short title",
    description: "TODO: one-sentence plain-English summary",
    sourceUrl:
      "https://www.palegis.us/cfdocs/billInfo/billInfo.cfm?syear=2025&sind=0&body=H&type=B&bn=2186",
  },
  motion: "That House Bill 2186 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 19, nay: 7, notVoting: 0 },
  // !! VERIFY: which rollcallid corresponds to HB 2186?
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1909&sessYr=2025&sessInd=0",
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
  id: "2025-04-14-house-housing-hb2109",
  date: "2025-04-14",
  chamber: "House",
  committee: "Housing and Urban Affairs",
  bill: {
    id: "HB2109",
    label: "HB 2109",
    session: "2025-2026",
    chamber: "House",
    shortTitle: "TODO: short title",
    description: "TODO: one-sentence plain-English summary",
    sourceUrl:
      "https://www.palegis.us/cfdocs/billInfo/billInfo.cfm?syear=2025&sind=0&body=H&type=B&bn=2109",
  },
  motion: "That House Bill 2109 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 19, nay: 7, notVoting: 0 },
  // !! VERIFY: which rollcallid corresponds to HB 2109?
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1915&sessYr=2025&sessInd=0",
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

export const APRIL_14_2025_ROLL_CALLS: RollCall[] = [
  ROLL_CALL_HB2186,
  ROLL_CALL_HB2109,
];
