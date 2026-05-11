import type {
  Bill,
  Chamber,
  Cosponsorship,
  MapItem,
  MemberVote,
  RollCall,
  Vote,
} from "./types";
import { MEMBERS_BY_ID } from "@/data/members";

export interface DistrictVoteSnapshot {
  district: string;
  vote: Vote | null; // null = no record (not on committee, vacancy, etc.)
  memberId: string | null;
  memberName: string | null;
  party: "D" | "R" | "I" | null;
  isCosponsor: boolean;
  isSponsor: boolean;
}

/* ---------------------------------------------------------------------- */
/*  MapItem accessors                                                     */
/* ---------------------------------------------------------------------- */

export const getMapItemBill = (item: MapItem): Bill =>
  item.kind === "rollCall" ? item.rollCall.bill : item.bill;

export const getMapItemChamber = (item: MapItem): Chamber =>
  getMapItemBill(item).chamber;

export const getMapItemId = (item: MapItem): string =>
  item.kind === "rollCall" ? item.rollCall.id : `cosponsors-${item.bill.id}`;

export const getMapItemRollCall = (item: MapItem): RollCall | null =>
  item.kind === "rollCall" ? item.rollCall : null;

export const getMapItemCosponsorship = (item: MapItem): Cosponsorship | null =>
  item.kind === "cosponsorOnly" ? item.cosponsorship : null;

/* ---------------------------------------------------------------------- */
/*  Snapshot building                                                     */
/* ---------------------------------------------------------------------- */

/**
 * Build a district → snapshot map for a MapItem. Works for both roll
 * calls (votes + cosponsor overlay) and cosponsor-only items (just the
 * cosponsor overlay; vote stays null everywhere).
 */
export const snapshotByDistrict = (
  item: MapItem,
  cosponsorship?: Cosponsorship,
): Map<string, DistrictVoteSnapshot> => {
  const out = new Map<string, DistrictVoteSnapshot>();
  const rollCall = getMapItemRollCall(item);
  const cs = cosponsorship ?? getMapItemCosponsorship(item) ?? undefined;

  // 1. Vote records (only present for roll-call items)
  if (rollCall) {
    for (const mv of rollCall.votes) {
      const member = MEMBERS_BY_ID.get(mv.memberId);
      if (!member) continue;
      out.set(member.district, {
        district: member.district,
        vote: mv.vote,
        memberId: member.id,
        memberName: member.fullName,
        party: member.party,
        isCosponsor: false,
        isSponsor: false,
      });
    }
  }

  // 2. Merge cosponsorship data
  if (cs) {
    const { primeSponsor, cosponsors } = cs;
    const existingPrime = out.get(primeSponsor.district);
    if (existingPrime) {
      existingPrime.isSponsor = true;
      existingPrime.isCosponsor = true;
    } else {
      out.set(primeSponsor.district, {
        district: primeSponsor.district,
        vote: null,
        memberId: null,
        memberName: primeSponsor.name,
        party: primeSponsor.party,
        isCosponsor: true,
        isSponsor: true,
      });
    }
    for (const c of cosponsors) {
      const snap = out.get(c.district);
      if (snap) {
        snap.isCosponsor = true;
      } else {
        out.set(c.district, {
          district: c.district,
          vote: null,
          memberId: null,
          memberName: c.name,
          party: c.party,
          isCosponsor: true,
          isSponsor: false,
        });
      }
    }
  }

  return out;
};

/* ---------------------------------------------------------------------- */
/*  Helpers                                                               */
/* ---------------------------------------------------------------------- */

/**
 * Find a member's vote on a specific roll call.
 */
export const findVote = (
  rollCall: RollCall,
  memberId: string,
): MemberVote | undefined =>
  rollCall.votes.find((v) => v.memberId === memberId);

/* ---------------------------------------------------------------------- */
/*  Cross-chamber nesting rollups                                         */
/* ---------------------------------------------------------------------- */

export interface NestedSupport {
  yea: number;
  nay: number;
  cosponsor: number; // House members who cosponsored but did not vote on this roll call
  noRecord: number; // No vote, no cosponsorship
  total: number; // Districts considered (typically those >= 50% overlap)
  supportPct: number; // (yea + cosponsor without yea) / total
}

interface NestedHouseDistrict {
  district: string;
  overlapShareOfHD?: number;
}

/**
 * Aggregate a senate district's nested House delegation's stance on a
 * MapItem. Only counts House districts whose center-of-mass primarily
 * sits inside the senate district (overlap >= 0.5 — slivers from the
 * neighbors are excluded).
 */
export const computeNestedSupport = (
  nestedHDs: NestedHouseDistrict[] | undefined,
  item: MapItem,
  houseSnapshots: Map<string, DistrictVoteSnapshot>,
): NestedSupport => {
  const out: NestedSupport = {
    yea: 0,
    nay: 0,
    cosponsor: 0,
    noRecord: 0,
    total: 0,
    supportPct: 0,
  };
  if (!nestedHDs) return out;
  // Filter to HDs primarily nested in this SD.
  const primary = nestedHDs.filter(
    (n) => (n.overlapShareOfHD ?? 0) >= 0.5,
  );
  for (const n of primary) {
    out.total += 1;
    const snap = houseSnapshots.get(n.district);
    if (!snap) {
      out.noRecord += 1;
      continue;
    }
    if (snap.vote === "Yea") out.yea += 1;
    else if (snap.vote === "Nay") out.nay += 1;
    else if (snap.isCosponsor) out.cosponsor += 1;
    else out.noRecord += 1;
  }
  // "Support" = Yea + cosponsor-without-vote. For roll-call items the
  // user cares about the vote; for cosponsor-only items cosponsorship is
  // the only signal we have.
  const supportCount =
    item.kind === "rollCall" ? out.yea + out.cosponsor : out.cosponsor;
  out.supportPct = out.total > 0 ? supportCount / out.total : 0;
  return out;
};

/**
 * Build per-Senate-district nested-support data for the active item.
 * Returns a Map keyed by senate district id.
 */
export const senateNestedSupportMap = (
  senateFeatures: Array<{
    properties: { district: string; nestedHouseDistricts?: NestedHouseDistrict[] };
  }>,
  item: MapItem,
  houseSnapshots: Map<string, DistrictVoteSnapshot>,
): Map<string, NestedSupport> => {
  const out = new Map<string, NestedSupport>();
  for (const f of senateFeatures) {
    out.set(
      f.properties.district,
      computeNestedSupport(f.properties.nestedHouseDistricts, item, houseSnapshots),
    );
  }
  return out;
};
