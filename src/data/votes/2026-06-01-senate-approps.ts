import type { RollCall } from "@/lib/types";
import { SB1277, SB1279, SB1281 } from "@/data/bills/all-bills";

/**
 * Senate Appropriations committee — June 1, 2026.
 *
 * The Senate Urban Affairs & Housing package's fiscal-note step. The
 * committee has 22 members (14 R + 8 D).
 *
 * Four votes on housing bills, all on June 1:
 *   SB 1277 rc 780 — Reported as Committed, 22-0
 *   SB 1279 rc 781 — Reported as Amended,   14-8 (party-line: all D Nay)
 *   SB 1279 rc 782 — A03366 amendment vote, 15-7 (Cappelletti crossed
 *                                                 over for the amendment)
 *   SB 1281 rc 783 — Reported as Committed, 21-1 (Sen. Langerholc R
 *                                                 sole Nay; his A-3426
 *                                                 landed on the floor
 *                                                 June 2 anyway)
 *
 * Parsed via pipeline/scripts/fetch_rollcall.py --committee-code 3.
 * JSONs live at pipeline/data/rollcalls/2025-senate-cmte3-rc78*.json.
 */

const APPROPS_URL = (rc: number) =>
  `https://www.palegis.us/senate/committees/roll-call-votes/vote-list/vote-summary?committeecode=3&rollcallid=${rc}&sessYr=2025&sessInd=0`;

const APPROPS_D_YEA = [
  "senate-2025-amanda-m-cappelletti",
  "senate-2025-jay-costa",
  "senate-2025-art-haywood",
  "senate-2025-vincent-j-hughes",
  "senate-2025-timothy-p-kearney",
  "senate-2025-patty-kim",
  "senate-2025-judith-l-schwank",
  "senate-2025-sharif-street",
];

const APPROPS_R_YEA = [
  "senate-2025-rosemary-m-brown",
  "senate-2025-jarrett-coleman",
  "senate-2025-lynda-schlegel-culver",
  "senate-2025-cris-dush",
  "senate-2025-wayne-langerholc",
  "senate-2025-daniel-laughlin",
  "senate-2025-scott-martin",
  "senate-2025-tracy-pennycuick",
  "senate-2025-kristin-phillips-hill",
  "senate-2025-joe-picozzi",
  "senate-2025-joe-pittman",
  "senate-2025-devlin-j-robinson",
  "senate-2025-elder-a-vogel",
  "senate-2025-kim-l-ward",
];

/* -------------------------------------------------------------------------- */
/*  SB 1277 — Property Tax Abatement for Housing Redevelopment (22-0)         */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1277_APPROPS: RollCall = {
  id: "2026-06-01-senate-approps-sb1277-reported",
  date: "2026-06-01",
  chamber: "Senate",
  committee: "Appropriations",
  bill: SB1277,
  motion: "That SB 1277 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 22, nay: 0, notVoting: 0 },
  sourceUrl: APPROPS_URL(780),
  votes: [
    ...APPROPS_D_YEA.map((id) => ({ memberId: id, vote: "Yea" as const })),
    ...APPROPS_R_YEA.map((id) => ({ memberId: id, vote: "Yea" as const })),
  ],
};

/* -------------------------------------------------------------------------- */
/*  SB 1279 — Regulatory Compliance Officer for Housing                       */
/*  rc 781 (Reported as Amended, 14-8) + rc 782 (A03366 amendment, 15-7)      */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1279_APPROPS_REPORTED: RollCall = {
  id: "2026-06-01-senate-approps-sb1279-reported",
  date: "2026-06-01",
  chamber: "Senate",
  committee: "Appropriations",
  bill: SB1279,
  motion: "That SB 1279 be reported as amended.",
  outcome: "Passed",
  totals: { yea: 14, nay: 8, notVoting: 0 },
  sourceUrl: APPROPS_URL(781),
  stage: "Approps – Reported as Amended",
  votes: [
    // All 8 D voted Nay
    ...APPROPS_D_YEA.map((id) => ({ memberId: id, vote: "Nay" as const })),
    // All 14 R voted Yea
    ...APPROPS_R_YEA.map((id) => ({ memberId: id, vote: "Yea" as const })),
  ],
};

export const ROLL_CALL_SB1279_APPROPS_A03366: RollCall = {
  id: "2026-06-01-senate-approps-sb1279-a03366",
  date: "2026-06-01",
  chamber: "Senate",
  committee: "Appropriations",
  bill: SB1279,
  motion: "On the adoption of Amendment A03366.",
  outcome: "Passed",
  totals: { yea: 15, nay: 7, notVoting: 0 },
  sourceUrl: APPROPS_URL(782),
  stage: "Approps – A03366 amendment",
  votes: [
    // Cappelletti crossed over on the amendment; other 7 D voted Nay
    { memberId: "senate-2025-amanda-m-cappelletti", vote: "Yea" },
    { memberId: "senate-2025-jay-costa", vote: "Nay" },
    { memberId: "senate-2025-art-haywood", vote: "Nay" },
    { memberId: "senate-2025-vincent-j-hughes", vote: "Nay" },
    { memberId: "senate-2025-timothy-p-kearney", vote: "Nay" },
    { memberId: "senate-2025-patty-kim", vote: "Nay" },
    { memberId: "senate-2025-judith-l-schwank", vote: "Nay" },
    { memberId: "senate-2025-sharif-street", vote: "Nay" },
    // All 14 R Yea
    ...APPROPS_R_YEA.map((id) => ({ memberId: id, vote: "Yea" as const })),
  ],
};

/* -------------------------------------------------------------------------- */
/*  SB 1281 — Pre-Approved Housing Plans (21-1, Langerholc R sole Nay)        */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_SB1281_APPROPS: RollCall = {
  id: "2026-06-01-senate-approps-sb1281-reported",
  date: "2026-06-01",
  chamber: "Senate",
  committee: "Appropriations",
  bill: SB1281,
  motion: "That SB 1281 be reported as committed.",
  outcome: "Passed",
  totals: { yea: 21, nay: 1, notVoting: 0 },
  sourceUrl: APPROPS_URL(783),
  votes: [
    // All 8 D Yea
    ...APPROPS_D_YEA.map((id) => ({ memberId: id, vote: "Yea" as const })),
    // 13 R Yea, Langerholc sole Nay
    { memberId: "senate-2025-rosemary-m-brown", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Yea" },
    { memberId: "senate-2025-lynda-schlegel-culver", vote: "Yea" },
    { memberId: "senate-2025-cris-dush", vote: "Yea" },
    { memberId: "senate-2025-wayne-langerholc", vote: "Nay" },
    { memberId: "senate-2025-daniel-laughlin", vote: "Yea" },
    { memberId: "senate-2025-scott-martin", vote: "Yea" },
    { memberId: "senate-2025-tracy-pennycuick", vote: "Yea" },
    { memberId: "senate-2025-kristin-phillips-hill", vote: "Yea" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-joe-pittman", vote: "Yea" },
    { memberId: "senate-2025-devlin-j-robinson", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
  ],
};

export const JUNE_1_2026_SENATE_APPROPS_ROLL_CALLS: RollCall[] = [
  ROLL_CALL_SB1277_APPROPS,
  ROLL_CALL_SB1279_APPROPS_REPORTED,
  ROLL_CALL_SB1279_APPROPS_A03366,
  ROLL_CALL_SB1281_APPROPS,
];
