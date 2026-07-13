import type { RollCall } from "@/lib/types";
import { SB1279 } from "@/data/bills/all-bills";

/**
 * SB 1279 Senate Final Passage — Wednesday, June 3, 2026, 12:22 PM.
 * Printer's number 1756 (post-Approps re-report as amended).
 *
 * Passed 30-20. 26 of 27 Republicans Yea (Coleman sole R Nay);
 * 4 of 23 Democrats Yea (Boscola, Kearney, Malone, Miller crossed
 * over) with the other 19 D voting Nay.
 *
 * Bill creates a Commonwealth Housing Regulatory Compliance Officer
 * position inside DCED to streamline housing-construction permitting
 * across state executive agencies.
 *
 * Source: palegis.us Senate roll call 388
 *   https://www.palegis.us/senate/roll-calls/summary?sessYr=2025&sessInd=0&rcNum=388
 * Parsed via pipeline/scripts/fetch_rollcall.py;
 * data at pipeline/data/rollcalls/2025-senate-rc388.json.
 */
export const ROLL_CALL_SB1279_FINAL_PASSAGE: RollCall = {
  id: "2026-06-03-senate-floor-sb1279-final",
  date: "2026-06-03",
  chamber: "Senate",
  bill: SB1279,
  motion:
    "Providing for issuance of housing construction permits by executive agencies, for designation of Commonwealth Housing Regulatory Compliance Officer and for timelines for permits related to housing construction; and imposing duties on the Office of Transformation and Opportunity.",
  outcome: "Passed",
  totals: { yea: 30, nay: 20, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/senate/roll-calls/summary?sessYr=2025&sessInd=0&rcNum=388",
  stage: "Final Passage",
  stageEmphasis: "bold",
  votes: [
    // Democrats — 4 Yea, 19 Nay
    { memberId: "senate-2025-lisa-m-boscola", vote: "Yea" },
    { memberId: "senate-2025-amanda-m-cappelletti", vote: "Nay" },
    { memberId: "senate-2025-maria-collett", vote: "Nay" },
    { memberId: "senate-2025-carolyn-t-comitta", vote: "Nay" },
    { memberId: "senate-2025-jay-costa", vote: "Nay" },
    { memberId: "senate-2025-marty-flynn", vote: "Nay" },
    { memberId: "senate-2025-wayne-d-fontana", vote: "Nay" },
    { memberId: "senate-2025-art-haywood", vote: "Nay" },
    { memberId: "senate-2025-vincent-j-hughes", vote: "Nay" },
    { memberId: "senate-2025-john-i-kane", vote: "Nay" },
    { memberId: "senate-2025-timothy-p-kearney", vote: "Yea" },
    { memberId: "senate-2025-patty-kim", vote: "Nay" },
    { memberId: "senate-2025-james-andrew-malone", vote: "Yea" },
    { memberId: "senate-2025-nick-miller", vote: "Yea" },
    { memberId: "senate-2025-katie-j-muth", vote: "Nay" },
    { memberId: "senate-2025-nick-pisciottano", vote: "Nay" },
    { memberId: "senate-2025-steven-j-santarsiero", vote: "Nay" },
    { memberId: "senate-2025-nikil-saval", vote: "Nay" },
    { memberId: "senate-2025-judith-l-schwank", vote: "Nay" },
    { memberId: "senate-2025-sharif-street", vote: "Nay" },
    { memberId: "senate-2025-christine-m-tartaglione", vote: "Nay" },
    { memberId: "senate-2025-anthony-h-williams", vote: "Nay" },
    { memberId: "senate-2025-lindsey-m-williams", vote: "Nay" },
    // Republicans — 26 Yea, 1 Nay (Coleman sole R Nay)
    { memberId: "senate-2025-david-g-argall", vote: "Yea" },
    { memberId: "senate-2025-lisa-baker", vote: "Yea" },
    { memberId: "senate-2025-camera-bartolotta", vote: "Yea" },
    { memberId: "senate-2025-michele-brooks", vote: "Yea" },
    { memberId: "senate-2025-rosemary-m-brown", vote: "Yea" },
    { memberId: "senate-2025-jarrett-coleman", vote: "Nay" },
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
