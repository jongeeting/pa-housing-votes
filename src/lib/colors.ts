import type { Vote, Party } from "./types";

/**
 * Vote → fill color. Tuned for colorblind safety (Okabe-Ito-ish).
 * Yea = bluish-green, Nay = vermillion, abstain/missing = neutral gray.
 */
export const VOTE_COLORS: Record<Vote, string> = {
  Yea: "#1b9e77",
  Nay: "#d95f02",
  "Not Voting": "#9ca3af",
  Absent: "#9ca3af",
  Excused: "#9ca3af",
};

export const VOTE_FILL_OPACITY = 0.78;

/**
 * Party → stroke color, used to layer partisan signal on top
 * of the vote choropleth (e.g. a red outline around an "R" district
 * that voted Yea makes the cross-party support pop).
 */
export const PARTY_STROKE: Record<Party, string> = {
  D: "#1d4ed8",
  R: "#b91c1c",
  I: "#6b7280",
};

export const NO_VOTE_FILL = "#e5e7eb";
