import type { MapItem } from "@/lib/types";
import { APRIL_13_2026_ROLL_CALLS } from "./votes/2026-04-13-housing";
import { ROLL_CALL_HB2186_FLOOR } from "./votes/2026-05-06-hb2186-floor";
import { ROLL_CALL_HB2186_FINAL_PASSAGE } from "./votes/2026-06-01-hb2186-final";
import { ROLL_CALL_HB2109_2ND_CONS } from "./votes/2026-06-02-hb2109-2nd";
import { JUNE_5_2024_ROLL_CALLS } from "./votes/2024-06-05-local-government";
import {
  SB1239,
  SB1346,
  SB1263,
  SB1277,
  SB1278,
  SB1279,
  SB1281,
  SR211,
  HOUSE_MEMO_47776,
  SENATE_MEMO_47956,
  SENATE_MEMO_48019,
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
  HR484,
  SB1126,
} from "./bills/all-bills";
import { SB1126_COSPONSORSHIP } from "./cosponsors/sb1126-cosponsors";
import { SB1239_COSPONSORSHIP } from "./cosponsors/sb1239-cosponsors";
import { SB1346_COSPONSORSHIP } from "./cosponsors/sb1346-cosponsors";
import { SB1263_COSPONSORSHIP } from "./cosponsors/sb1263-cosponsors";
import { SB1277_COSPONSORSHIP } from "./cosponsors/sb1277-cosponsors";
import { SB1278_COSPONSORSHIP } from "./cosponsors/sb1278-cosponsors";
import { SB1279_COSPONSORSHIP } from "./cosponsors/sb1279-cosponsors";
import { SB1281_COSPONSORSHIP } from "./cosponsors/sb1281-cosponsors";
import { SR211_COSPONSORSHIP } from "./cosponsors/sr211-cosponsors";
import { HB2367_COSPONSORSHIP } from "./cosponsors/hb2367-cosponsors";
import { HB2434_COSPONSORSHIP } from "./cosponsors/hb2434-cosponsors";
import { HOUSE_MEMO_47776_COSPONSORSHIP } from "./cosponsors/house-memo-47776-cosponsors";
import { SENATE_MEMO_47956_COSPONSORSHIP } from "./cosponsors/senate-memo-47956-cosponsors";
import { SENATE_MEMO_48019_COSPONSORSHIP } from "./cosponsors/senate-memo-48019-cosponsors";
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
  // HB 2186 has two House floor votes: the May 6 second-consideration
  // pass-through (134-67) and the June 1 third-consideration final
  // passage (139-62, with 5 net votes flipping toward Yea). Both are
  // surfaced as separate items so the popup can show the procedural
  // arc — and so we can pivot the map between "early vote" and
  // "final vote" choropleths.
  { kind: "rollCall", rollCall: ROLL_CALL_HB2186_FLOOR },
  { kind: "rollCall", rollCall: ROLL_CALL_HB2186_FINAL_PASSAGE },
  // HB 2109 Golden Girls Law 2nd Consideration — June 2, 2026.
  // The April 13 committee vote is also wired in via the
  // APRIL_13_2026_ROLL_CALLS spread above.
  { kind: "rollCall", rollCall: ROLL_CALL_HB2109_2ND_CONS },

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

  // ----- 2025-2026 Senate cosponsor-only items -----
  { kind: "cosponsorOnly", bill: SB1346, cosponsorship: SB1346_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1263, cosponsorship: SB1263_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1277, cosponsorship: SB1277_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1278, cosponsorship: SB1278_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1279, cosponsorship: SB1279_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1281, cosponsorship: SB1281_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SR211, cosponsorship: SR211_COSPONSORSHIP },
  { kind: "cosponsorOnly", bill: SB1239, cosponsorship: SB1239_COSPONSORSHIP },
  {
    kind: "cosponsorOnly",
    bill: SENATE_MEMO_48019,
    cosponsorship: SENATE_MEMO_48019_COSPONSORSHIP,
  },
  {
    kind: "cosponsorOnly",
    bill: SENATE_MEMO_47956,
    cosponsorship: SENATE_MEMO_47956_COSPONSORSHIP,
  },
];
