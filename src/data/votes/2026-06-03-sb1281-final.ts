import type { RollCall } from "@/lib/types";
import { SB1281 } from "@/data/bills/all-bills";

/**
 * SB 1281 Senate Final Passage — Wednesday, June 3, 2026, 12:37 PM.
 * Printer's number 1760 (post-Langerholc-amendment A-3426).
 *
 * Passed 50-0 unanimously. Every seated senator voted Yea. The
 * Langerholc amendment adopted the day before (June 2, Senate rc 382,
 * also 50-0) narrowed the bill's preemption posture to require
 * compliance with local zoning; the amended bill then passed
 * unopposed.
 *
 * Source: palegis.us Senate roll call 389
 *   https://www.palegis.us/senate/roll-calls/summary?sessYr=2025&sessInd=0&rcNum=389
 * Parsed via pipeline/scripts/fetch_rollcall.py;
 * data at pipeline/data/rollcalls/2025-senate-rc389.json.
 */
export const ROLL_CALL_SB1281_FINAL_PASSAGE: RollCall = {
  id: "2026-06-03-senate-floor-sb1281-final",
  date: "2026-06-03",
  chamber: "Senate",
  bill: SB1281,
  motion:
    "An Act amending the act of July 31, 1968 (P.L.805, No.247), known as the Pennsylvania Municipalities Planning Code, in planned residential development, providing for expedited high density housing approval.",
  outcome: "Passed",
  totals: { yea: 50, nay: 0, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/senate/roll-calls/summary?sessYr=2025&sessInd=0&rcNum=389",
  stage: "Final Passage",
  stageEmphasis: "bold",
  votes: [
    // Democrats — 23 Yea, 0 Nay
    { memberId: "senate-2025-lisa-m-boscola", vote: "Yea" },
    { memberId: "senate-2025-amanda-m-cappelletti", vote: "Yea" },
    { memberId: "senate-2025-maria-collett", vote: "Yea" },
    { memberId: "senate-2025-carolyn-t-comitta", vote: "Yea" },
    { memberId: "senate-2025-jay-costa", vote: "Yea" },
    { memberId: "senate-2025-marty-flynn", vote: "Yea" },
    { memberId: "senate-2025-wayne-d-fontana", vote: "Yea" },
    { memberId: "senate-2025-art-haywood", vote: "Yea" },
    { memberId: "senate-2025-vincent-j-hughes", vote: "Yea" },
    { memberId: "senate-2025-john-i-kane", vote: "Yea" },
    { memberId: "senate-2025-timothy-p-kearney", vote: "Yea" },
    { memberId: "senate-2025-patty-kim", vote: "Yea" },
    { memberId: "senate-2025-james-andrew-malone", vote: "Yea" },
    { memberId: "senate-2025-nick-miller", vote: "Yea" },
    { memberId: "senate-2025-katie-j-muth", vote: "Yea" },
    { memberId: "senate-2025-nick-pisciottano", vote: "Yea" },
    { memberId: "senate-2025-steven-j-santarsiero", vote: "Yea" },
    { memberId: "senate-2025-nikil-saval", vote: "Yea" },
    { memberId: "senate-2025-judith-l-schwank", vote: "Yea" },
    { memberId: "senate-2025-sharif-street", vote: "Yea" },
    { memberId: "senate-2025-christine-m-tartaglione", vote: "Yea" },
    { memberId: "senate-2025-anthony-h-williams", vote: "Yea" },
    { memberId: "senate-2025-lindsey-m-williams", vote: "Yea" },
    // Republicans — 27 Yea, 0 Nay
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-lisa-baker", vote: "Yea" },
    { memberId: "senate-2025-camera-bartolotta", vote: "Yea" },
    { memberId: "senate-2025-michele-brooks", vote: "Yea" },
    { memberId: "senate-2025-rosemary-m-brown", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Yea" },
    { memberId: "senate-2025-lynda-schlegel-culver", vote: "Yea" },
    { memberId: "senate-2025-cris-dush", vote: "Yea" },
    { memberId: "senate-2025-frank-a-farry", vote: "Yea" },
    { memberId: "senate-2025-chris-gebhard", vote: "Yea" },
    { memberId: "senate-2025-scott-e-hutchinson", vote: "Yea" },
    { memberId: "senate-2025-dawn-w-keefer", vote: "Yea" },
    { memberId: "senate-2025-wayne-langerholc", vote: "Yea" },
    { memberId: "senate-2025-daniel-laughlin", vote: "Yea" },
    { memberId: "senate-2025-scott-martin", vote: "Yea" },
    { memberId: "senate-2025-doug-mastriano", vote: "Yea" },
    { memberId: "senate-2025-tracy-pennycuick", vote: "Yea" },
    { memberId: "senate-2025-kristin-phillips-hill", vote: "Yea" },
    { memberId: "senate-2025-joe-picozzi", vote: "Yea" },
    { memberId: "senate-2025-joe-pittman", vote: "Yea" },
    { memberId: "senate-2025-devlin-j-robinson", vote: "Yea" },
    { memberId: "senate-2025-greg-rothman", vote: "Yea" },
    { memberId: "senate-2025-patrick-j-stefano", vote: "Yea" },
    { memberId: "senate-2025-elder-a-vogel", vote: "Yea" },
    { memberId: "senate-2025-judy-ward", vote: "Yea" },
    { memberId: "senate-2025-kim-l-ward", vote: "Yea" },
    { memberId: "senate-2025-gene-yaw", vote: "Yea" },
  ],
};
