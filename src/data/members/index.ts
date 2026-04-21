import type { Member } from "@/lib/types";
import { HOUSING_COMMITTEE_MEMBERS_2025 } from "./committee-housing-2025";
import { LOCALGOV_COMMITTEE_MEMBERS_2023 } from "./localgov-2023";

/**
 * All known members across sessions.
 *
 * - HOUSING_COMMITTEE_MEMBERS_2025: the current House Housing & Community
 *   Development Committee (26 members).
 * - LOCALGOV_COMMITTEE_MEMBERS_2023: the 25 members of the 2023–24 House
 *   Local Government Committee who voted on HB 1976 / HB 2045.
 *
 * Some legislators appear in both (e.g. Smith-Wade-El served on Local
 * Gov in 2023–24 and on Housing in 2025–26) — they have distinct member
 * IDs per session so roll call lookups resolve to the right record.
 *
 * As the site grows, additional cohorts (Senate committees, full
 * chambers for letter lookups) can be composed in here.
 */
export const MEMBERS: Member[] = [
  ...HOUSING_COMMITTEE_MEMBERS_2025,
  ...LOCALGOV_COMMITTEE_MEMBERS_2023,
];

/**
 * Lookup by district number. Only the current (2025–26) Housing committee
 * for now — the popup uses this to render "who represents this district
 * today." When we expand to the full House + Senate member directory,
 * this can widen. The 2023–24 Local Government roster is deliberately
 * NOT in here so it doesn't shadow the current incumbent when both
 * served in the same district (e.g. Smith-Wade-El HD-49).
 */
export const MEMBERS_BY_DISTRICT = new Map(
  HOUSING_COMMITTEE_MEMBERS_2025
    .filter((m) => m.district !== "")
    .map((m) => [m.district, m]),
);

/** Lookup by member ID (includes former members for historical roll calls). */
export const MEMBERS_BY_ID = new Map(MEMBERS.map((m) => [m.id, m]));
