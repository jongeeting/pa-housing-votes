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
