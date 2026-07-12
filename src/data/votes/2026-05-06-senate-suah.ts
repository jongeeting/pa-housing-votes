import type { RollCall } from "@/lib/types";
import { SB1277, SB1278, SB1279, SB1281 } from "@/data/bills/all-bills";

/**
 * Senate Urban Affairs & Housing committee — May 6, 2026.
 *
 * Four housing bills reported out on the same day. The committee has
 * 11 members (7 R + 4 D):
 *   Republicans (7): Argall, Coleman, Farry, Keefer, Picozzi (Chair),
 *                    Vogel, Ward (ex-officio)
 *   Democrats (4):   Fontana, Miller, Saval, Street
 *
 * Sources: palegis.us committee votes
 *   rc 759 SB 1277  https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=759&sessYr=2025&sessInd=0
 *   rc 760 SB 1278  https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=760&sessYr=2025&sessInd=0
 *   rc 761 SB 1279  https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=761&sessYr=2025&sessInd=0
 *   rc 762 SB 1281  https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=762&sessYr=2025&sessInd=0
 * Parsed via pipeline/scripts/fetch_rollcall.py --committee-code 35.
 */

const SUAH_URL = (rc: number) =>
  `https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=35&rollcallid=${rc}&sessYr=2025&sessInd=0`;

/* -------------------------------------------------------------------------- */
/*  SB 1277 — Property Tax Abatement for Housing Redevelopment                */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1277_SUAH: RollCall = {
  id: "2026-05-06-senate-suah-sb1277-reported",
  date: "2026-05-06",
  chamber: "Senate",
  committee: "Urban Affairs and Housing",
  bill: SB1277,
  motion: "That SB 1277 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 9, nay: 2, notVoting: 0 },
  sourceUrl: SUAH_URL(759),
  votes: [
    // Democrats — 4 Yea, 0 Nay
    { memberId: "senate-2025-wayne-d-fontana", vote: "Yea" },
    { memberId: "senate-2025-nick-miller", vote: "Yea" },
    { memberId: "senate-2025-nikil-saval", vote: "Yea" },
    { memberId: "senate-2025-sharif-street", vote: "Yea" },
    // Republicans — 5 Yea, 2 Nay
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Nay" },
    { memberId: "senate-2025-frank-a-farry", vote: "Yea" },
    { memberId: "senate-2025-dawn-w-keefer", vote: "Nay" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  SB 1278 — Residential Economic Development District Grant Program         */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1278_SUAH: RollCall = {
  id: "2026-05-06-senate-suah-sb1278-reported",
  date: "2026-05-06",
  chamber: "Senate",
  committee: "Urban Affairs and Housing",
  bill: SB1278,
  motion: "That SB 1278 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 9, nay: 2, notVoting: 0 },
  sourceUrl: SUAH_URL(760),
  votes: [
    // Democrats — 4 Yea, 0 Nay
    { memberId: "senate-2025-wayne-d-fontana", vote: "Yea" },
    { memberId: "senate-2025-nick-miller", vote: "Yea" },
    { memberId: "senate-2025-nikil-saval", vote: "Yea" },
    { memberId: "senate-2025-sharif-street", vote: "Yea" },
    // Republicans — 5 Yea, 2 Nay
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Nay" },
    { memberId: "senate-2025-frank-a-farry", vote: "Yea" },
    { memberId: "senate-2025-dawn-w-keefer", vote: "Nay" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  SB 1279 — Regulatory Compliance Officer for Housing                       */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1279_SUAH: RollCall = {
  id: "2026-05-06-senate-suah-sb1279-reported",
  date: "2026-05-06",
  chamber: "Senate",
  committee: "Urban Affairs and Housing",
  bill: SB1279,
  motion: "That SB 1279 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 8, nay: 3, notVoting: 0 },
  sourceUrl: SUAH_URL(761),
  votes: [
    // Democrats — 1 Yea, 3 Nay (Fontana, Saval, Street voted Nay)
    { memberId: "senate-2025-wayne-d-fontana", vote: "Nay" },
    { memberId: "senate-2025-nick-miller", vote: "Yea" },
    { memberId: "senate-2025-nikil-saval", vote: "Nay" },
    { memberId: "senate-2025-sharif-street", vote: "Nay" },
    // Republicans — 7 Yea, 0 Nay
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Yea" },
    { memberId: "senate-2025-frank-a-farry", vote: "Yea" },
    { memberId: "senate-2025-dawn-w-keefer", vote: "Yea" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  SB 1281 — Pre-Approved Housing Plans                                      */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1281_SUAH: RollCall = {
  id: "2026-05-06-senate-suah-sb1281-reported",
  date: "2026-05-06",
  chamber: "Senate",
  committee: "Urban Affairs and Housing",
  bill: SB1281,
  motion: "That SB 1281 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 10, nay: 1, notVoting: 0 },
  sourceUrl: SUAH_URL(762),
  votes: [
    // Democrats — 3 Yea, 1 Nay (Miller sole D Nay)
    { memberId: "senate-2025-wayne-d-fontana", vote: "Yea" },
    { memberId: "senate-2025-nick-miller", vote: "Nay" },
    { memberId: "senate-2025-nikil-saval", vote: "Yea" },
    { memberId: "senate-2025-sharif-street", vote: "Yea" },
    // Republicans — 7 Yea, 0 Nay
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Yea" },
    { memberId: "senate-2025-frank-a-farry", vote: "Yea" },
    { memberId: "senate-2025-dawn-w-keefer", vote: "Yea" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
  ],
};

export const MAY_6_2026_SUAH_ROLL_CALLS: RollCall[] = [
  ROLL_CALL_SB1277_SUAH,
  ROLL_CALL_SB1278_SUAH,
  ROLL_CALL_SB1279_SUAH,
  ROLL_CALL_SB1281_SUAH,
];
