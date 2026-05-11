import type { RollCall } from "@/lib/types";
import { HB1976, HB2045 } from "../bills/all-bills";

/**
 * House Local Government committee — June 5, 2024.
 *
 * Two Siegel zoning reform bills from the 2023-24 session, both passed
 * committee but never advanced further and were laid on the table when
 * session ended:
 *
 *   HB 1976 — Multi-family housing in office-zoned areas (commercial
 *     conversion). Reintroduced this term as HB 1459.
 *   HB 2045 — Duplex / triplex / quadplex by-right in single-family
 *     zones (missing middle). Reintroduced this term as HB 2185.
 *
 * Note: an earlier version of this file described both bills as missing-
 * middle. That was wrong for HB 1976 — verified against palegis.
 *
 * Member IDs use ad-hoc strings since most of these legislators aren't
 * in the current committee-housing-2025 dataset. The district is the
 * stable key for mapping.
 *
 * Source:
 *   HB 1976 — palegis.us rollcallid=1878 (14–11)
 *   HB 2045 — palegis.us rollcallid=1882 (13–12)
 */

/* -------------------------------------------------------------------------- */
/*  HB 1976  —  14 Yea / 11 Nay (party-line)                                  */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB1976: RollCall = {
  id: "2024-06-05-house-localgov-hb1976",
  date: "2024-06-05",
  chamber: "House",
  committee: "Local Government",
  bill: HB1976,
  motion: "That House Bill 1976 be reported as amended.",
  outcome: "Passed",
  totals: { yea: 14, nay: 11, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=30&rollcallid=1878&sessYr=2023&sessInd=0",
  votes: [
    // Democrats — all Yea
    { memberId: "house-2023-136-freeman", vote: "Yea" },
    { memberId: "house-2023-168-borowski", vote: "Yea" },
    { memberId: "house-2023-151-cerrato", vote: "Yea" },
    { memberId: "house-2023-113-donahue", vote: "Yea" },
    { memberId: "house-2023-105-fleming", vote: "Yea" },
    { memberId: "house-2023-61-hanbidge", vote: "Yea" },
    { memberId: "house-2023-159-kazeem", vote: "Yea" },
    { memberId: "house-2023-104-madsen", vote: "Yea" },
    { memberId: "house-2023-144-munroe", vote: "Yea" },
    { memberId: "house-2023-189-probst", vote: "Yea" },
    { memberId: "house-2023-140-prokopiak", vote: "Yea" },
    { memberId: "house-2023-34-salisbury", vote: "Yea" },
    { memberId: "house-2023-158-sappey", vote: "Yea" },
    { memberId: "house-2023-49-smith-wade-el", vote: "Yea" },
    // Republicans — all Nay
    { memberId: "house-2023-64-james", vote: "Nay" }, // Former: R. Lee James (Republican Chair)
    { memberId: "house-2023-4-banta", vote: "Nay" },
    { memberId: "house-2023-94-fink", vote: "Nay" },
    { memberId: "house-2023-fritz", vote: "Nay" }, // Former: Jonathan Fritz
    { memberId: "house-2023-98-jones", vote: "Nay" },
    { memberId: "house-2023-39-kuzma", vote: "Nay" },
    { memberId: "house-2023-41-miller", vote: "Nay" },
    { memberId: "house-2023-rader", vote: "Nay" }, // Former: Jack Rader
    { memberId: "house-2023-119-ryncavage", vote: "Nay" },
    { memberId: "house-2023-116-watro", vote: "Nay" },
    { memberId: "house-2023-7-wentling", vote: "Nay" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  HB 2045  —  13 Yea / 12 Nay (Sappey flipped to Nay)                       */
/* -------------------------------------------------------------------------- */

export const ROLL_CALL_HB2045: RollCall = {
  id: "2024-06-05-house-localgov-hb2045",
  date: "2024-06-05",
  chamber: "House",
  committee: "Local Government",
  bill: HB2045,
  motion: "That House Bill 2045 be reported as amended.",
  outcome: "Passed",
  totals: { yea: 13, nay: 12, notVoting: 0 },
  sourceUrl:
    "https://www.palegis.us/house/committees/roll-call-votes/vote-list/vote-summary?committeecode=30&rollcallid=1882&sessYr=2023&sessInd=0",
  votes: [
    // Democrats — 13 Yea, 1 Nay (Sappey flipped)
    { memberId: "house-2023-136-freeman", vote: "Yea" },
    { memberId: "house-2023-168-borowski", vote: "Yea" },
    { memberId: "house-2023-151-cerrato", vote: "Yea" },
    { memberId: "house-2023-113-donahue", vote: "Yea" },
    { memberId: "house-2023-105-fleming", vote: "Yea" },
    { memberId: "house-2023-61-hanbidge", vote: "Yea" },
    { memberId: "house-2023-159-kazeem", vote: "Yea" },
    { memberId: "house-2023-104-madsen", vote: "Yea" },
    { memberId: "house-2023-144-munroe", vote: "Yea" },
    { memberId: "house-2023-189-probst", vote: "Yea" },
    { memberId: "house-2023-140-prokopiak", vote: "Yea" },
    { memberId: "house-2023-34-salisbury", vote: "Yea" },
    { memberId: "house-2023-158-sappey", vote: "Nay" }, // ← flipped from Yea on HB 1976
    { memberId: "house-2023-49-smith-wade-el", vote: "Yea" },
    // Republicans — all Nay
    { memberId: "house-2023-64-james", vote: "Nay" },
    { memberId: "house-2023-4-banta", vote: "Nay" },
    { memberId: "house-2023-94-fink", vote: "Nay" },
    { memberId: "house-2023-fritz", vote: "Nay" },
    { memberId: "house-2023-98-jones", vote: "Nay" },
    { memberId: "house-2023-39-kuzma", vote: "Nay" },
    { memberId: "house-2023-41-miller", vote: "Nay" },
    { memberId: "house-2023-rader", vote: "Nay" },
    { memberId: "house-2023-119-ryncavage", vote: "Nay" },
    { memberId: "house-2023-116-watro", vote: "Nay" },
    { memberId: "house-2023-7-wentling", vote: "Nay" },
  ],
};

export const JUNE_5_2024_ROLL_CALLS: RollCall[] = [
  ROLL_CALL_HB1976,
  ROLL_CALL_HB2045,
];
