import type { RollCall } from "@/lib/types";
import { HB2109 } from "@/data/bills/all-bills";

/**
 * House Appropriations committee — June 3, 2026.
 *
 * HB 2109 (Khan, Golden Girls / occupancy reform) Re-report Bill
 * As Committed: 37-0 unanimous. Fiscal-note re-report teeing up
 * Final Passage on the House floor June 8 (rc 1119, 123-78).
 *
 * All 22 Democrats and all 15 Republicans on the committee voted Yea.
 *
 * Source: palegis.us committee rollcallid=2264
 *   https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=62&rollcallid=2264&sessYr=2025&sessInd=0
 * Parsed via pipeline/scripts/fetch_rollcall.py --committee-code 62
 *   --committee-rc-id 2264.
 */
export const ROLL_CALL_HB2109_HOUSE_APPROPS: RollCall = {
  id: "2026-06-03-house-approps-hb2109-reported",
  date: "2026-06-03",
  chamber: "House",
  committee: "Appropriations",
  bill: HB2109,
  motion: "That HB 2109 be re-reported as committed.",
  outcome: "Passed",
  totals: { yea: 37, nay: 0, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=62&rollcallid=2264&sessYr=2025&sessInd=0",
  votes: [
    // Democrats — 22 Yea, 0 Nay
    { memberId: "house-2025-aerion-abney", vote: "Yea" },
    { memberId: "house-2025-anthony-bellmon", vote: "Yea" },
    { memberId: "house-2025-tim-brennan", vote: "Yea" },
    { memberId: "house-2025-gina-curry", vote: "Yea" },
    { memberId: "house-2025-kyle-donahue", vote: "Yea" },
    { memberId: "house-2025-justin-fleming", vote: "Yea" },
    { memberId: "house-2025-paul-friel", vote: "Yea" },
    { memberId: "house-2025-pat-gallagher", vote: "Yea" },
    { memberId: "house-2025-manuel-guzman", vote: "Yea" },
    { memberId: "house-2025-jordan-harris", vote: "Yea" },
    { memberId: "house-2025-tarik-khan", vote: "Yea" },
    { memberId: "house-2025-emily-kinkead", vote: "Yea" },
    { memberId: "house-2025-bridget-kosierowski", vote: "Yea" },
    { memberId: "house-2025-dave-madsen", vote: "Yea" },
    { memberId: "house-2025-steven-malagari", vote: "Yea" },
    { memberId: "house-2025-la-tasha-mayes", vote: "Yea" },
    { memberId: "house-2025-kyle-mullins", vote: "Yea" },
    { memberId: "house-2025-abigail-salisbury", vote: "Yea" },
    { memberId: "house-2025-benjamin-sanchez", vote: "Yea" },
    { memberId: "house-2025-ben-waxman", vote: "Yea" },
    { memberId: "house-2025-joe-webster", vote: "Yea" },
    { memberId: "house-2025-regina-g-young", vote: "Yea" },

    // Republicans — 15 Yea, 0 Nay
    { memberId: "house-2025-jamie-barton", vote: "Yea" },
    { memberId: "house-2025-marla-brown", vote: "Yea" },
    { memberId: "house-2025-eric-davanzo", vote: "Yea" },
    { memberId: "house-2025-ann-flood", vote: "Yea" },
    { memberId: "house-2025-joshua-kail", vote: "Yea" },
    { memberId: "house-2025-charity-krupa", vote: "Yea" },
    { memberId: "house-2025-thomas-kutz", vote: "Yea" },
    { memberId: "house-2025-zachary-mako", vote: "Yea" },
    { memberId: "house-2025-kristin-marcell", vote: "Yea" },
    { memberId: "house-2025-marci-mustello", vote: "Yea" },
    { memberId: "house-2025-eric-nelson", vote: "Yea" },
    { memberId: "house-2025-jeff-olsommer", vote: "Yea" },
    { memberId: "house-2025-chad-reichard", vote: "Yea" },
    { memberId: "house-2025-jim-rigby", vote: "Yea" },
    { memberId: "house-2025-james-struzzi", vote: "Yea" },
  ],
};
