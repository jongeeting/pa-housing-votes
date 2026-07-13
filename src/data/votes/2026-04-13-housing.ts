import type { RollCall } from "@/lib/types";
import { HB2186, HB2109 } from "@/data/bills/all-bills";

/**
 * House Housing and Community Development committee — April 13, 2026.
 *
 * Two state zoning reform bills reported out of committee on the same
 * day, both by 19-7 margins but with different Republican coalitions.
 *
 *   HB 2186 — committee roll call (palegis.us rollcallid=1915)
 *   HB 2109 — committee roll call (palegis.us rollcallid=1909)
 *
 * Vote details transcribed from the official roll call summary
 * screenshots provided 2026-04-13. Member IDs reference the canonical
 * PA_HOUSE_MEMBERS_2025 roster.
 */

/* -------------------------------------------------------------------------- */
/*  HB 2186                                                                   */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2186: RollCall = {
  id: "2026-04-13-house-housing-hb2186",
  date: "2026-04-13",
  chamber: "House",
  committee: "Housing and Community Development",
  bill: HB2186,
  motion: "That House Bill 2186 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 19, nay: 7, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1915&sessYr=2025&sessInd=0",
  votes: [
    // Democrats — all Yea
    { memberId: "house-2025-brandon-markosek", vote: "Yea" },
    { memberId: "house-2025-aerion-abney", vote: "Yea" },
    { memberId: "house-2025-heather-boyd", vote: "Yea" },
    { memberId: "house-2025-amen-brown", vote: "Yea" },
    { memberId: "house-2025-morgan-cephas", vote: "Yea" },
    { memberId: "house-2025-g-roni-green", vote: "Yea" },
    { memberId: "house-2025-rick-krajewski", vote: "Yea" },
    { memberId: "house-2025-dave-madsen", vote: "Yea" },
    { memberId: "house-2025-la-tasha-mayes", vote: "Yea" },
    { memberId: "house-2025-lindsay-powell", vote: "Yea" },
    { memberId: "house-2025-tarah-probst", vote: "Yea" },
    { memberId: "house-2025-ismail-smith-wade-el", vote: "Yea" },
    { memberId: "house-2025-ana-tiburcio", vote: "Yea" },
    { memberId: "house-2025-ben-waxman", vote: "Yea" },
    // Republicans — 5 Yea, 7 Nay
    { memberId: "house-2025-rich-irvin", vote: "Yea" },
    { memberId: "house-2025-josh-bashline", vote: "Yea" },
    { memberId: "house-2025-tom-jones", vote: "Nay" },
    { memberId: "house-2025-dallas-kephart", vote: "Yea" },
    { memberId: "house-2025-milou-mackenzie", vote: "Nay" },
    { memberId: "house-2025-abby-major", vote: "Yea" },
    { memberId: "house-2025-brian-rasel", vote: "Yea" },
    { memberId: "house-2025-leslie-rossi", vote: "Nay" },
    { memberId: "house-2025-jeremy-shaffer", vote: "Nay" },
    { memberId: "house-2025-tim-twardzik", vote: "Nay" },
    { memberId: "house-2025-jamie-walsh", vote: "Nay" },
    { memberId: "house-2025-eric-weaknecht", vote: "Nay" },
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
  bill: HB2109,
  motion: "That House Bill 2109 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 19, nay: 7, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1909&sessYr=2025&sessInd=0",
  votes: [
    // Democrats — all Yea (same as HB 2186)
    { memberId: "house-2025-brandon-markosek", vote: "Yea" },
    { memberId: "house-2025-aerion-abney", vote: "Yea" },
    { memberId: "house-2025-heather-boyd", vote: "Yea" },
    { memberId: "house-2025-amen-brown", vote: "Yea" },
    { memberId: "house-2025-morgan-cephas", vote: "Yea" },
    { memberId: "house-2025-g-roni-green", vote: "Yea" },
    { memberId: "house-2025-rick-krajewski", vote: "Yea" },
    { memberId: "house-2025-dave-madsen", vote: "Yea" },
    { memberId: "house-2025-la-tasha-mayes", vote: "Yea" },
    { memberId: "house-2025-lindsay-powell", vote: "Yea" },
    { memberId: "house-2025-tarah-probst", vote: "Yea" },
    { memberId: "house-2025-ismail-smith-wade-el", vote: "Yea" },
    { memberId: "house-2025-ana-tiburcio", vote: "Yea" },
    { memberId: "house-2025-ben-waxman", vote: "Yea" },
    // Republicans — 5 Yea, 7 Nay (Rasel & Twardzik flipped vs HB 2186)
    { memberId: "house-2025-rich-irvin", vote: "Yea" },
    { memberId: "house-2025-josh-bashline", vote: "Yea" },
    { memberId: "house-2025-tom-jones", vote: "Nay" },
    { memberId: "house-2025-dallas-kephart", vote: "Yea" },
    { memberId: "house-2025-milou-mackenzie", vote: "Nay" },
    { memberId: "house-2025-abby-major", vote: "Yea" },
    { memberId: "house-2025-brian-rasel", vote: "Nay" }, // flipped from Yea
    { memberId: "house-2025-leslie-rossi", vote: "Nay" },
    { memberId: "house-2025-jeremy-shaffer", vote: "Nay" },
    { memberId: "house-2025-tim-twardzik", vote: "Yea" }, // flipped from Nay
    { memberId: "house-2025-jamie-walsh", vote: "Nay" },
    { memberId: "house-2025-eric-weaknecht", vote: "Nay" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  HB 2186 amendment vote — A02831 (26-0 unanimous)                          */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2186_A02831: RollCall = {
  id: "2026-04-13-house-housing-hb2186-a02831",
  date: "2026-04-13",
  chamber: "House",
  committee: "Housing and Community Development",
  bill: HB2186,
  motion: "On the adoption of Amendment A02831.",
  outcome: "Passed",
  totals: { yea: 26, nay: 0, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1914&sessYr=2025&sessInd=0",
  stage: "Housing & Community Development – A02831 amendment",
  votes: [
    // Democrats — 14 Yea, 0 Nay
    { memberId: "house-2025-aerion-abney", vote: "Yea" },
    { memberId: "house-2025-heather-boyd", vote: "Yea" },
    { memberId: "house-2025-amen-brown", vote: "Yea" },
    { memberId: "house-2025-morgan-cephas", vote: "Yea" },
    { memberId: "house-2025-g-roni-green", vote: "Yea" },
    { memberId: "house-2025-rick-krajewski", vote: "Yea" },
    { memberId: "house-2025-dave-madsen", vote: "Yea" },
    { memberId: "house-2025-brandon-markosek", vote: "Yea" },
    { memberId: "house-2025-la-tasha-mayes", vote: "Yea" },
    { memberId: "house-2025-lindsay-powell", vote: "Yea" },
    { memberId: "house-2025-tarah-probst", vote: "Yea" },
    { memberId: "house-2025-ismail-smith-wade-el", vote: "Yea" },
    { memberId: "house-2025-ana-tiburcio", vote: "Yea" },
    { memberId: "house-2025-ben-waxman", vote: "Yea" },
    // Republicans — 12 Yea, 0 Nay
    { memberId: "house-2025-josh-bashline", vote: "Yea" },
    { memberId: "house-2025-rich-irvin", vote: "Yea" },
    { memberId: "house-2025-tom-jones", vote: "Yea" },
    { memberId: "house-2025-dallas-kephart", vote: "Yea" },
    { memberId: "house-2025-milou-mackenzie", vote: "Yea" },
    { memberId: "house-2025-abby-major", vote: "Yea" },
    { memberId: "house-2025-brian-rasel", vote: "Yea" },
    { memberId: "house-2025-leslie-rossi", vote: "Yea" },
    { memberId: "house-2025-jeremy-shaffer", vote: "Yea" },
    { memberId: "house-2025-tim-twardzik", vote: "Yea" },
    { memberId: "house-2025-jamie-walsh", vote: "Yea" },
    { memberId: "house-2025-eric-weaknecht", vote: "Yea" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  HB 2109 amendment vote — A02848 (25-1, Rossi sole Nay)                    */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2109_A02848: RollCall = {
  id: "2026-04-13-house-housing-hb2109-a02848",
  date: "2026-04-13",
  chamber: "House",
  committee: "Housing and Community Development",
  bill: HB2109,
  motion: "On the adoption of Amendment A02848.",
  outcome: "Passed",
  totals: { yea: 25, nay: 1, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=64&rollcallid=1908&sessYr=2025&sessInd=0",
  stage: "Housing & Community Development – A02848 amendment",
  votes: [
    // Democrats — 14 Yea, 0 Nay
    { memberId: "house-2025-aerion-abney", vote: "Yea" },
    { memberId: "house-2025-heather-boyd", vote: "Yea" },
    { memberId: "house-2025-amen-brown", vote: "Yea" },
    { memberId: "house-2025-morgan-cephas", vote: "Yea" },
    { memberId: "house-2025-g-roni-green", vote: "Yea" },
    { memberId: "house-2025-rick-krajewski", vote: "Yea" },
    { memberId: "house-2025-dave-madsen", vote: "Yea" },
    { memberId: "house-2025-brandon-markosek", vote: "Yea" },
    { memberId: "house-2025-la-tasha-mayes", vote: "Yea" },
    { memberId: "house-2025-lindsay-powell", vote: "Yea" },
    { memberId: "house-2025-tarah-probst", vote: "Yea" },
    { memberId: "house-2025-ismail-smith-wade-el", vote: "Yea" },
    { memberId: "house-2025-ana-tiburcio", vote: "Yea" },
    { memberId: "house-2025-ben-waxman", vote: "Yea" },
    // Republicans — 11 Yea, 1 Nay (Rossi sole Nay)
    { memberId: "house-2025-josh-bashline", vote: "Yea" },
    { memberId: "house-2025-rich-irvin", vote: "Yea" },
    { memberId: "house-2025-tom-jones", vote: "Yea" },
    { memberId: "house-2025-dallas-kephart", vote: "Yea" },
    { memberId: "house-2025-milou-mackenzie", vote: "Yea" },
    { memberId: "house-2025-abby-major", vote: "Yea" },
    { memberId: "house-2025-brian-rasel", vote: "Yea" },
    { memberId: "house-2025-leslie-rossi", vote: "Nay" },
    { memberId: "house-2025-jeremy-shaffer", vote: "Yea" },
    { memberId: "house-2025-tim-twardzik", vote: "Yea" },
    { memberId: "house-2025-jamie-walsh", vote: "Yea" },
    { memberId: "house-2025-eric-weaknecht", vote: "Yea" },
  ],
};

export const APRIL_13_2026_ROLL_CALLS: RollCall[] = [
  ROLL_CALL_HB2186,
  ROLL_CALL_HB2186_A02831,
  ROLL_CALL_HB2109,
  ROLL_CALL_HB2109_A02848,
];
