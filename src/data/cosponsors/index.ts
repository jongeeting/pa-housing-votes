import type { Cosponsorship } from "@/lib/types";

// 2025–2026 House bills
import { HB1459_COSPONSORSHIP } from "./hb1459-cosponsors";
import { HB2109_COSPONSORSHIP } from "./hb2109-cosponsors";
import { HB2155_COSPONSORSHIP } from "./hb2155-cosponsors";
import { HB2185_COSPONSORSHIP } from "./hb2185-cosponsors";
import { HB2186_COSPONSORSHIP } from "./hb2186-cosponsors";
import { HB2192_COSPONSORSHIP } from "./hb2192-cosponsors";
import { HB2367_COSPONSORSHIP } from "./hb2367-cosponsors";
import { HB2423_COSPONSORSHIP } from "./hb2423-cosponsors";
import { HB2428_COSPONSORSHIP } from "./hb2428-cosponsors";
import { HB2430_COSPONSORSHIP } from "./hb2430-cosponsors";
import { HB2434_COSPONSORSHIP } from "./hb2434-cosponsors";
import { HB2445_COSPONSORSHIP } from "./hb2445-cosponsors";
import { HR484_COSPONSORSHIP } from "./hr484-cosponsors";

// 2025–2026 Senate bills
import { SB1239_COSPONSORSHIP } from "./sb1239-cosponsors";
import { SB1263_COSPONSORSHIP } from "./sb1263-cosponsors";
import { SB1277_COSPONSORSHIP } from "./sb1277-cosponsors";
import { SB1278_COSPONSORSHIP } from "./sb1278-cosponsors";
import { SB1279_COSPONSORSHIP } from "./sb1279-cosponsors";
import { SB1281_COSPONSORSHIP } from "./sb1281-cosponsors";
import { SB1346_COSPONSORSHIP } from "./sb1346-cosponsors";
import { SR211_COSPONSORSHIP } from "./sr211-cosponsors";
import { SR348_COSPONSORSHIP } from "./sr348-cosponsors";

// 2025–2026 cosponsorship memos
import { HOUSE_MEMO_47776_COSPONSORSHIP } from "./house-memo-47776-cosponsors";
import { SENATE_MEMO_47956_COSPONSORSHIP } from "./senate-memo-47956-cosponsors";
import { SENATE_MEMO_48019_COSPONSORSHIP } from "./senate-memo-48019-cosponsors";

// 2023–2024 historical
import { HB1976_COSPONSORSHIP } from "./hb1976-cosponsors";
import { HB1988_COSPONSORSHIP } from "./hb1988-cosponsors";
import { HB2045_COSPONSORSHIP } from "./hb2045-cosponsors";
import { SB1126_COSPONSORSHIP } from "./sb1126-cosponsors";

/**
 * All tracked cosponsorships, one per bill.
 * Used by BillCard to show prime sponsor + cosponsor count.
 */
export const COSPONSORSHIPS: Cosponsorship[] = [
  // 2025–2026 House
  HB1459_COSPONSORSHIP,
  HB2109_COSPONSORSHIP,
  HB2155_COSPONSORSHIP,
  HB2185_COSPONSORSHIP,
  HB2186_COSPONSORSHIP,
  HB2192_COSPONSORSHIP,
  HB2367_COSPONSORSHIP,
  HB2423_COSPONSORSHIP,
  HB2428_COSPONSORSHIP,
  HB2430_COSPONSORSHIP,
  HB2434_COSPONSORSHIP,
  HB2445_COSPONSORSHIP,
  HR484_COSPONSORSHIP,

  // 2025–2026 Senate
  SB1239_COSPONSORSHIP,
  SB1263_COSPONSORSHIP,
  SB1277_COSPONSORSHIP,
  SB1278_COSPONSORSHIP,
  SB1279_COSPONSORSHIP,
  SB1281_COSPONSORSHIP,
  SB1346_COSPONSORSHIP,
  SR211_COSPONSORSHIP,
  SR348_COSPONSORSHIP,

  // 2025–2026 memos
  HOUSE_MEMO_47776_COSPONSORSHIP,
  SENATE_MEMO_47956_COSPONSORSHIP,
  SENATE_MEMO_48019_COSPONSORSHIP,

  // 2023–2024 historical
  HB1976_COSPONSORSHIP,
  HB1988_COSPONSORSHIP,
  HB2045_COSPONSORSHIP,
  SB1126_COSPONSORSHIP,
];

/** Lookup by bill ID (e.g. "HB2109"). */
export const COSPONSORSHIPS_BY_BILL = new Map<string, Cosponsorship>(
  COSPONSORSHIPS.map((c) => [c.billId, c]),
);
