import type { Member } from "@/lib/types";
import { PA_HOUSE_MEMBERS_2025 } from "./pa-house-2025";

/**
 * House Housing & Community Development committee, 2025-2026 session.
 *
 * 14 Democrats + 12 Republicans = 26 total members.
 *
 * Members are referenced by ID from PA_HOUSE_MEMBERS_2025 (the canonical
 * full-house roster). This file holds only committee membership and role
 * annotations — Member objects themselves live in pa-house-2025.ts.
 */

const ROSTER_BY_ID = new Map(PA_HOUSE_MEMBERS_2025.map((m) => [m.id, m]));

interface CommitteeSeat {
  id: string;
  role?: "Chair" | "Republican Chair";
}

const HOUSING_COMMITTEE_SEATS_2025: CommitteeSeat[] = [
  // Democrats (Majority)
  { id: "house-2025-brandon-markosek", role: "Chair" },
  { id: "house-2025-aerion-abney" },
  { id: "house-2025-heather-boyd" },
  { id: "house-2025-amen-brown" },
  { id: "house-2025-morgan-cephas" },
  { id: "house-2025-g-roni-green" },
  { id: "house-2025-rick-krajewski" },
  { id: "house-2025-dave-madsen" },
  { id: "house-2025-la-tasha-mayes" },
  { id: "house-2025-lindsay-powell" },
  { id: "house-2025-tarah-probst" },
  { id: "house-2025-ismail-smith-wade-el" },
  { id: "house-2025-ana-tiburcio" },
  { id: "house-2025-ben-waxman" },
  // Republicans (Minority)
  { id: "house-2025-rich-irvin", role: "Republican Chair" },
  { id: "house-2025-josh-bashline" },
  { id: "house-2025-tom-jones" },
  { id: "house-2025-dallas-kephart" },
  { id: "house-2025-milou-mackenzie" },
  { id: "house-2025-abby-major" },
  { id: "house-2025-brian-rasel" },
  { id: "house-2025-leslie-rossi" },
  { id: "house-2025-jeremy-shaffer" },
  { id: "house-2025-tim-twardzik" },
  { id: "house-2025-jamie-walsh" },
  { id: "house-2025-eric-weaknecht" },
];

const resolveSeat = (seat: CommitteeSeat): Member => {
  const m = ROSTER_BY_ID.get(seat.id);
  if (!m) {
    throw new Error(
      `Housing committee references unknown member id: ${seat.id}. ` +
        `If the member retired or was redistricted, update this roster.`,
    );
  }
  return m;
};

export const HOUSING_COMMITTEE_MEMBERS_2025: Member[] =
  HOUSING_COMMITTEE_SEATS_2025.map(resolveSeat);

export const HOUSING_COMMITTEE_IDS_2025: ReadonlySet<string> = new Set(
  HOUSING_COMMITTEE_SEATS_2025.map((s) => s.id),
);

export const HOUSING_COMMITTEE_ROLES_2025: ReadonlyMap<string, string> = new Map(
  HOUSING_COMMITTEE_SEATS_2025.filter((s) => s.role).map((s) => [s.id, s.role!]),
);
