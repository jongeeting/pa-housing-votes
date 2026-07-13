import type { MapItem } from "@/lib/types";
import { APRIL_13_2026_ROLL_CALLS } from "./votes/2026-04-13-housing";
import { MAY_6_2026_SUAH_ROLL_CALLS } from "./votes/2026-05-06-senate-suah";
import { ROLL_CALL_HB2186_FLOOR } from "./votes/2026-05-06-hb2186-floor";
import { JUNE_1_2026_SENATE_APPROPS_ROLL_CALLS } from "./votes/2026-06-01-senate-approps";
import { ROLL_CALL_HB2186_HOUSE_APPROPS } from "./votes/2026-06-01-house-approps-hb2186";
import { ROLL_CALL_HB2186_FINAL_PASSAGE } from "./votes/2026-06-01-hb2186-final";
import { ROLL_CALL_HB2109_2ND_CONS } from "./votes/2026-06-02-hb2109-2nd";
import { ROLL_CALL_HB2109_HOUSE_APPROPS } from "./votes/2026-06-03-house-approps-hb2109";
import { ROLL_CALL_HB2109_FINAL_PASSAGE } from "./votes/2026-06-08-hb2109-final";
import { ROLL_CALL_SB1346_SUAH } from "./votes/2026-07-12-senate-suah-sb1346";
import { JUNE_5_2024_ROLL_CALLS } from "./votes/2024-06-05-local-government";
import {
  SB1239,
  SB1263,
  SR211,
  SR348,
  HOUSE_MEMO_47776,
  HB1459,
  HB1988,
  HB2185,
  HB2155,
  HB2192,
  HB2367,
  HB2423,
  HB2428,
  HB2430,
  HB2434,
  HB2445,
  HR484,
  SB1126,
} from "./bills/all-bills";
// Cosponsorship imports for MapItems. We only need these for bills
// that ONLY appear as cosponsor-overlay items — bills with vote
// data (roll-call MapItems) don't need a separate cosponsor-only
// entry, matching the House pattern (HB 2186 has no cosponsorOnly
// entry once its votes started landing). Memos succeeded by tracked
// bills also fold out; their content lives on the successor bill's
// card via the "Originally circulated as..." lineage line.
// Cosponsor data itself is always available via COSPONSORSHIPS_BY_BILL
// (used by the bill cards + DistrictPopup); this list is scoped to
// what the dropdown surfaces as its own MapItem.
import { SB1126_COSPONSORSHIP } from "./cosponsors/sb1126-cosponsors";
import { SB1239_COSPONSORSHIP } from "./cosponsors/sb1239-cosponsors";
import { SB1263_COSPONSORSHIP } from "./cosponsors/sb1263-cosponsors";
import { SR211_COSPONSORSHIP } from "./cosponsors/sr211-cosponsors";
import { SR348_COSPONSORSHIP } from "./cosponsors/sr348-cosponsors";
import { HB2367_COSPONSORSHIP } from "./cosponsors/hb2367-cosponsors";
import { HB2434_COSPONSORSHIP } from "./cosponsors/hb2434-cosponsors";
import { HB2445_COSPONSORSHIP } from "./cosponsors/hb2445-cosponsors";
import { HOUSE_MEMO_47776_COSPONSORSHIP } from "./cosponsors/house-memo-47776-cosponsors";
import { HB1459_COSPONSORSHIP } from "./cosponsors/hb1459-cosponsors";
import { HB1988_COSPONSORSHIP } from "./cosponsors/hb1988-cosponsors";
import { HB2185_COSPONSORSHIP } from "./cosponsors/hb2185-cosponsors";
import { HB2155_COSPONSORSHIP } from "./cosponsors/hb2155-cosponsors";
import { HB2192_COSPONSORSHIP } from "./cosponsors/hb2192-cosponsors";
import { HB2423_COSPONSORSHIP } from "./cosponsors/hb2423-cosponsors";
import { HB2428_COSPONSORSHIP } from "./cosponsors/hb2428-cosponsors";
import { HB2430_COSPONSORSHIP } from "./cosponsors/hb2430-cosponsors";
import { HR484_COSPONSORSHIP } from "./cosponsors/hr484-cosponsors";

/**
 * Every item the vote map can show as a tab.
 *
 * Two flavors:
 * - Roll-call items render the choropleth from member votes, with the
 *   bill's cosponsorship layered on as a purple overlay.
 * - Cosponsor-only items have no vote yet (bill is in committee, or
 *   the memo hasn't been introduced as a bill) — the map shows just
 *   the prime sponsor + cosponsors in purple.
 *
 * Order roughly: current House votes, historical House votes, House
 * cosponsor-only bills (no vote yet), then the Senate slate.
 */
export const ALL_MAP_ITEMS: MapItem[] = [
  // ----- 2025-2026 House roll calls -----
  ...APRIL_13_2026_ROLL_CALLS.map((rc) => ({ kind: "rollCall" as const, rollCall: rc })),
  // HB 2186 procedural arc: HCD April 13 (in APRIL_13 spread above,
  // reported + A02831 amendment) -> 2nd Consideration May 6 -> House
  // Appropriations re-report June 1 -> Final Passage June 1. Each
  // stage its own MapItem so the map can pivot between them.
  { kind: "rollCall", rollCall: ROLL_CALL_HB2186_FLOOR },
  { kind: "rollCall", rollCall: ROLL_CALL_HB2186_HOUSE_APPROPS },
  { kind: "rollCall", rollCall: ROLL_CALL_HB2186_FINAL_PASSAGE },
  // HB 2109 Golden Girls Law: HCD April 13 (in APRIL_13 spread,
  // reported + A02848 amendment) -> 2nd Consideration June 2 ->
  // House Appropriations re-report June 3 -> Final Passage June 8.
  { kind: "rollCall", rollCall: ROLL_CALL_HB2109_2ND_CONS },
  { kind: "rollCall", rollCall: ROLL_CALL_HB2109_HOUSE_APPROPS },
  { kind: "rollCall", rollCall: ROLL_CALL_HB2109_FINAL_PASSAGE },

  // ----- 2025-2026 House cosponsor-only items (no roll call yet) -----
  { kind: "cosponsorOnly", bill: HB1459, cosponsorship: HB1459_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2185, cosponsorship: HB2185_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2155, cosponsorship: HB2155_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2192, cosponsorship: HB2192_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2367, cosponsorship: HB2367_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2423, cosponsorship: HB2423_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2428, cosponsorship: HB2428_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2430, cosponsorship: HB2430_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2434, cosponsorship: HB2434_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HB2445, cosponsorship: HB2445_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: HR484, cosponsorship: HR484_COSPONSORSHIP },
  // 2025–2026 House cosponsorship memos (no bill yet)
  {
    kind: "cosponsorOnly",
    bill: HOUSE_MEMO_47776,
    cosponsorship: HOUSE_MEMO_47776_COSPONSORSHIP,
  },

  // ----- 2023-2024 House roll calls (historical) -----
  ...JUNE_5_2024_ROLL_CALLS.map((rc) => ({ kind: "rollCall" as const, rollCall: rc })),

  // ----- 2023-2024 House cosponsor-only items (historical, no roll call) -----
  { kind: "cosponsorOnly", bill: HB1988, cosponsorship: HB1988_COSPONSORSHIP },

  // ----- 2023-2024 Senate cosponsor-only items (historical) -----
  { kind: "cosponsorOnly", bill: SB1126, cosponsorship: SB1126_COSPONSORSHIP },

  // ----- 2025-2026 Senate committee votes -----
  // Senate Urban Affairs & Housing May 6 batch (SB 1277, SB 1278,
  // SB 1279, SB 1281 reported as committed) and Senate Appropriations
  // June 1 batch (SB 1277 reported, SB 1279 reported as amended +
  // A03366 amendment vote, SB 1281 reported) — 8 items total. The
  // SB 1346 SUAH July 12 vote follows as a single item.
  ...MAY_6_2026_SUAH_ROLL_CALLS.map(
    (rc) => ({ kind: "rollCall" as const, rollCall: rc }),
  ),
  ...JUNE_1_2026_SENATE_APPROPS_ROLL_CALLS.map(
    (rc) => ({ kind: "rollCall" as const, rollCall: rc }),
  ),
  { kind: "rollCall", rollCall: ROLL_CALL_SB1346_SUAH },

  // ----- 2025-2026 Senate cosponsor-only items -----
  // Only bills that don't have any roll-call data yet get their own
  // cosponsor-overlay MapItem, mirroring the House convention
  // (HB 2186 lost its cosponsor-only item once vote data landed).
  // SB 1346, SB 1277, SB 1278, SB 1279, SB 1281 all have committee
  // rollCalls now, so their cosponsor overlays fold out — cosponsor
  // count still shows on the bill card + the district popup.
  //
  // Memos succeeded by tracked bills (SENATE_MEMO_48019 → SB 1346,
  // SENATE_MEMO_47956 → SR 348) fold out the same way; their content
  // lives on the successor bill/resolution's card via the
  // "Originally circulated as..." lineage line.
  { kind: "cosponsorOnly", bill: SB1263, cosponsorship: SB1263_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SR211, cosponsorship: SR211_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SR348, cosponsorship: SR348_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1239, cosponsorship: SB1239_COSPONSORSHIP },
];
