import type { Chamber, Member } from "@/lib/types";
import { PA_HOUSE_MEMBERS_2025 } from "./pa-house-2025";
import { PA_SENATE_MEMBERS_2025 } from "./pa-senate-2025";
import { HOUSING_COMMITTEE_MEMBERS_2025 } from "./committee-housing-2025";
import { LOCALGOV_COMMITTEE_MEMBERS_2023 } from "./localgov-2023";

/**
 * All known members across sessions and chambers.
 *
 * - PA_HOUSE_MEMBERS_2025: 201 sitting House members (2 of 203 seats
 *   vacant). Built from the HB 2186 floor roll call (rcNum 1054).
 * - PA_SENATE_MEMBERS_2025: 50 sitting Senators. Scraped from palegis
 *   member directory via pipeline/scripts/fetch_roster.py.
 * - LOCALGOV_COMMITTEE_MEMBERS_2023: 25 historical members of the
 *   2023-24 House Local Government Committee, kept around so HB 1976 /
 *   HB 2045 roll calls resolve correctly. IDs use the `house-2023-`
 *   prefix to avoid collisions with current incumbents.
 *
 * HOUSING_COMMITTEE_MEMBERS_2025 is a derived view of
 * PA_HOUSE_MEMBERS_2025 (committee-housing-2025.ts looks members up by
 * ID), so it is NOT included separately in MEMBERS.
 */
export const MEMBERS: Member[] = [
  ...PA_HOUSE_MEMBERS_2025,
  ...PA_SENATE_MEMBERS_2025,
  ...LOCALGOV_COMMITTEE_MEMBERS_2023,
];

/**
 * Per-chamber district lookups. Same district number means different
 * places in each chamber (HD-1 is in Erie, SD-1 is in Philly), so we
 * keep them separate and resolve by chamber.
 */
const HOUSE_BY_DISTRICT = new Map(
  PA_HOUSE_MEMBERS_2025.map((m) => [m.district, m]),
);
const SENATE_BY_DISTRICT = new Map(
  PA_SENATE_MEMBERS_2025.map((m) => [m.district, m]),
);

export const getMemberByDistrict = (
  chamber: Chamber,
  district: string,
): Member | null => {
  const map = chamber === "House" ? HOUSE_BY_DISTRICT : SENATE_BY_DISTRICT;
  return map.get(district) ?? null;
};

/**
 * Legacy export — defaults to House lookup. Prefer getMemberByDistrict
 * for new code so chamber is explicit.
 */
export const MEMBERS_BY_DISTRICT = HOUSE_BY_DISTRICT;

/** Lookup by member ID (includes former members for historical roll calls). */
export const MEMBERS_BY_ID = new Map(MEMBERS.map((m) => [m.id, m]));

export { HOUSING_COMMITTEE_MEMBERS_2025 };
