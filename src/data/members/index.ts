import type { Member } from "@/lib/types";
import { PA_HOUSE_MEMBERS_2025 } from "./pa-house-2025";
import { HOUSING_COMMITTEE_MEMBERS_2025 } from "./committee-housing-2025";
import { LOCALGOV_COMMITTEE_MEMBERS_2023 } from "./localgov-2023";

/**
 * All known members across sessions.
 *
 * - PA_HOUSE_MEMBERS_2025: the canonical 2025-2026 House roster (201
 *   sitting members; 2 vacant seats). Built from the HB 2186 floor
 *   vote roll call (rcNum 1054).
 * - LOCALGOV_COMMITTEE_MEMBERS_2023: 25 historical members of the
 *   2023-24 House Local Government Committee, kept around so the HB
 *   1976 / HB 2045 roll calls resolve correctly. IDs use the
 *   `house-2023-` prefix to avoid collisions with current incumbents.
 *
 * HOUSING_COMMITTEE_MEMBERS_2025 is a derived view of PA_HOUSE_MEMBERS_2025
 * (committee-housing-2025.ts looks members up by ID), so it is NOT
 * included separately in MEMBERS — that would double-count.
 */
export const MEMBERS: Member[] = [
  ...PA_HOUSE_MEMBERS_2025,
  ...LOCALGOV_COMMITTEE_MEMBERS_2023,
];

/**
 * Lookup by district number. Built from the full current House roster
 * so every district maps to its sitting rep — the popup uses this for
 * "who represents this district today." The 2023-24 Local Government
 * cohort is deliberately NOT included so historical members do not
 * shadow current incumbents.
 */
export const MEMBERS_BY_DISTRICT = new Map(
  PA_HOUSE_MEMBERS_2025.map((m) => [m.district, m]),
);

/** Lookup by member ID (includes former members for historical roll calls). */
export const MEMBERS_BY_ID = new Map(MEMBERS.map((m) => [m.id, m]));

export { HOUSING_COMMITTEE_MEMBERS_2025 };
