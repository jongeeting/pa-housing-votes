import type { Member } from "@/lib/types";
import { HOUSING_COMMITTEE_MEMBERS_2025 } from "./committee-housing-2025";

/**
 * All known members. For now this is just the House Housing & Urban
 * Affairs committee — the only members the blog post needs to render.
 *
 * Once we expand to multi-bill / multi-committee tracking we'll
 * generate this list from the official PA House member directory and
 * keep it under version control.
 */
export const MEMBERS: Member[] = [...HOUSING_COMMITTEE_MEMBERS_2025];

/**
 * Lookup by district number (skips members with empty district until
 * the user fills them in).
 */
export const MEMBERS_BY_DISTRICT = new Map(
  MEMBERS.filter((m) => m.district !== "").map((m) => [m.district, m]),
);

export const MEMBERS_BY_ID = new Map(MEMBERS.map((m) => [m.id, m]));
