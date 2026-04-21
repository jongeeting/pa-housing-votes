import type { Cosponsorship } from "@/lib/types";
import { HB2109_COSPONSORSHIP } from "./hb2109-cosponsors";
import { HB2186_COSPONSORSHIP } from "./hb2186-cosponsors";
import { HB2155_COSPONSORSHIP } from "./hb2155-cosponsors";
import { HB2185_COSPONSORSHIP } from "./hb2185-cosponsors";
import { HB2192_COSPONSORSHIP } from "./hb2192-cosponsors";
import { HB2423_COSPONSORSHIP } from "./hb2423-cosponsors";
import { HB2428_COSPONSORSHIP } from "./hb2428-cosponsors";
import { HB2430_COSPONSORSHIP } from "./hb2430-cosponsors";
import { HR484_COSPONSORSHIP } from "./hr484-cosponsors";
import { SB1239_COSPONSORSHIP } from "./sb1239-cosponsors";
import { SENATE_MEMO_47956_COSPONSORSHIP } from "./senate-memo-47956-cosponsors";
import { SENATE_MEMO_48019_COSPONSORSHIP } from "./senate-memo-48019-cosponsors";
import { HB1976_COSPONSORSHIP } from "./hb1976-cosponsors";
import { HB2045_COSPONSORSHIP } from "./hb2045-cosponsors";

/**
 * All tracked cosponsorships, one per bill.
 * House Memo 47776 (Inglis TOD) is intentionally absent — we don't have
 * a cosponsor list for it yet.
 */
export const COSPONSORSHIPS: Cosponsorship[] = [
  HB2109_COSPONSORSHIP,
  HB2186_COSPONSORSHIP,
  HB2155_COSPONSORSHIP,
  HB2185_COSPONSORSHIP,
  HB2192_COSPONSORSHIP,
  HB2423_COSPONSORSHIP,
  HB2428_COSPONSORSHIP,
  HB2430_COSPONSORSHIP,
  HR484_COSPONSORSHIP,
  SB1239_COSPONSORSHIP,
  SENATE_MEMO_47956_COSPONSORSHIP,
  SENATE_MEMO_48019_COSPONSORSHIP,
  HB1976_COSPONSORSHIP,
  HB2045_COSPONSORSHIP,
];

/** Lookup by bill ID (e.g. "HB2109"). */
export const COSPONSORSHIPS_BY_BILL = new Map<string, Cosponsorship>(
  COSPONSORSHIPS.map((c) => [c.billId, c]),
);
