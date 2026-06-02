import { useMemo, useState } from "react";
import type { Chamber, MapItem } from "@/lib/types";
import {
  getMapItemBill,
  getMapItemChamber,
  getMapItemCosponsorship,
  getMapItemRollCall,
  findVote,
} from "@/lib/voteAggregation";
import { COSPONSORSHIPS_BY_BILL } from "@/data/cosponsors";
import {
  getMemberByDistrict,
  PA_HOUSE_MEMBERS_2025,
  PA_SENATE_MEMBERS_2025,
} from "@/data/members";
import { VOTE_COLORS, COSPONSOR_FILL } from "@/lib/colors";

interface Props {
  /** The currently-selected MapItem (roll-call or cosponsor-only). */
  activeItem: MapItem | null;
  /** Open the district popup on the map for the given district. The
   *  parent component (VoteMap) wires this up by querying the loaded
   *  GeoJSON for the district feature + calling setSelectedDistrict. */
  onSelectDistrict?: (district: string, chamber: Chamber) => void;
}

type Vote = "Yea" | "Nay" | "NV" | "?" | "Cosponsor" | "Prime";
type GroupBy = "vote" | "party" | "district";
type VoteFilter = "all" | "yea" | "nay" | "nv";

interface Row {
  district: string;
  /** Numeric district sort key. */
  districtNum: number;
  name: string;
  lastName: string;
  party: string;
  vote: Vote;
}

/**
 * Below-the-map full vote list. Collapsed by default; once expanded,
 * shows a summary line, group/filter/search controls, and the full
 * member roll with vote + party + name + clickable district. Click
 * a row to open the district popup on the map.
 *
 * Supports two MapItem kinds:
 * - **Roll call**: renders the actual vote per member from the
 *   roll's vote data; missing members show as "?". Summary line
 *   shows Yea/Nay tallies by party.
 * - **Cosponsor-only**: renders the prime sponsor + cosponsors
 *   for the bill; non-sponsoring members are omitted entirely
 *   (a cosponsor list isn't the same as a vote roll). Summary
 *   line shows the cosponsor count.
 */
export const FullVoteList = ({ activeItem, onSelectDistrict }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("vote");
  const [filter, setFilter] = useState<VoteFilter>("all");
  const [search, setSearch] = useState("");

  // Build the row list off the current MapItem
  const { rows, summary, mode } = useMemo<{
    rows: Row[];
    summary: string;
    mode: "rollCall" | "cosponsorOnly" | "none";
  }>(() => {
    if (!activeItem) return { rows: [], summary: "", mode: "none" };
    const chamber = getMapItemChamber(activeItem);
    const roster =
      chamber === "House" ? PA_HOUSE_MEMBERS_2025 : PA_SENATE_MEMBERS_2025;

    if (activeItem.kind === "rollCall") {
      const rc = activeItem.rollCall;
      const out: Row[] = [];
      let yD = 0, yR = 0, nD = 0, nR = 0, nvAll = 0;
      for (const m of roster) {
        const v = findVote(rc, m.id);
        let vote: Vote = "?";
        if (v) {
          if (v.vote === "Yea") {
            vote = "Yea";
            if (m.party === "D") yD += 1; else if (m.party === "R") yR += 1;
          } else if (v.vote === "Nay") {
            vote = "Nay";
            if (m.party === "D") nD += 1; else if (m.party === "R") nR += 1;
          } else {
            vote = "NV";
            nvAll += 1;
          }
        }
        out.push({
          district: m.district,
          districtNum: parseInt(m.district, 10),
          name: m.fullName,
          lastName: m.lastName,
          party: m.party,
          vote,
        });
      }
      const summary = `${yD + yR} Yea (${yD} D + ${yR} R) · ${nD + nR} Nay (${nD} D + ${nR} R)${nvAll > 0 ? ` · ${nvAll} not voting` : ""}`;
      return { rows: out, summary, mode: "rollCall" };
    }
    // Cosponsor-only
    const bill = getMapItemBill(activeItem);
    const cs =
      getMapItemCosponsorship(activeItem) ??
      COSPONSORSHIPS_BY_BILL.get(bill.id);
    if (!cs) return { rows: [], summary: "(no cosponsor data)", mode: "cosponsorOnly" };
    const out: Row[] = [];
    out.push({
      district: cs.primeSponsor.district,
      districtNum: parseInt(cs.primeSponsor.district, 10),
      name: cs.primeSponsor.name,
      lastName: cs.primeSponsor.name.split(" ").pop() ?? cs.primeSponsor.name,
      party: cs.primeSponsor.party,
      vote: "Prime",
    });
    for (const c of cs.cosponsors) {
      out.push({
        district: c.district,
        districtNum: parseInt(c.district, 10),
        name: c.name,
        lastName: c.name.split(" ").pop() ?? c.name,
        party: c.party,
        vote: "Cosponsor",
      });
    }
    const dCount = out.filter((r) => r.party === "D").length;
    const rCount = out.filter((r) => r.party === "R").length;
    const summary = `${out.length} on the bill — ${dCount} D + ${rCount} R (1 prime sponsor + ${out.length - 1} cosponsor${out.length - 1 === 1 ? "" : "s"})`;
    return { rows: out, summary, mode: "cosponsorOnly" };
  }, [activeItem]);

  // Apply filter + search
  const filteredRows = useMemo(() => {
    let r = rows;
    if (mode === "rollCall") {
      if (filter === "yea") r = r.filter((x) => x.vote === "Yea");
      else if (filter === "nay") r = r.filter((x) => x.vote === "Nay");
      else if (filter === "nv") r = r.filter((x) => x.vote === "NV" || x.vote === "?");
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.lastName.toLowerCase().includes(q) ||
          x.district === q ||
          x.district === q.replace(/^0+/, "")
      );
    }
    return r;
  }, [rows, filter, search, mode]);

  // Group + sort
  const groups = useMemo(() => {
    const out: { label: string; rows: Row[] }[] = [];
    if (groupBy === "vote" && mode === "rollCall") {
      const buckets: Record<string, Row[]> = { Yea: [], Nay: [], NV: [], "?": [] };
      for (const r of filteredRows) buckets[r.vote].push(r);
      for (const k of ["Yea", "Nay", "NV", "?"]) {
        if (buckets[k].length === 0) continue;
        const sorted = [...buckets[k]].sort((a, b) =>
          a.lastName.localeCompare(b.lastName),
        );
        const label = k === "Yea" ? `Yea (${sorted.length})`
          : k === "Nay" ? `Nay (${sorted.length})`
            : k === "NV" ? `Not Voting (${sorted.length})`
              : `Not on roster (${sorted.length})`;
        out.push({ label, rows: sorted });
      }
    } else if (groupBy === "party") {
      const buckets: Record<string, Row[]> = { D: [], R: [], I: [] };
      for (const r of filteredRows) (buckets[r.party] ??= []).push(r);
      for (const p of ["D", "R", "I"]) {
        if (!buckets[p] || buckets[p].length === 0) continue;
        const sorted = [...buckets[p]].sort((a, b) =>
          a.lastName.localeCompare(b.lastName),
        );
        const partyName = p === "D" ? "Democrats" : p === "R" ? "Republicans" : "Independents";
        out.push({ label: `${partyName} (${sorted.length})`, rows: sorted });
      }
    } else if (groupBy === "district" || (groupBy === "vote" && mode !== "rollCall")) {
      const sorted = [...filteredRows].sort((a, b) => a.districtNum - b.districtNum);
      out.push({ label: `${sorted.length} ${mode === "cosponsorOnly" ? "on bill" : "members"}`, rows: sorted });
    }
    return out;
  }, [filteredRows, groupBy, mode]);

  if (!activeItem) return null;
  if (mode === "none") return null;

  const totalCount = rows.length;
  const filteredCount = filteredRows.length;
  const chamber = getMapItemChamber(activeItem);

  return (
    <section className="full-vote">
      {!expanded ? (
        <button
          type="button"
          className="full-vote__toggle"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          Show full {mode === "rollCall" ? "vote" : "cosponsor list"} ({totalCount} members) ▾
        </button>
      ) : (
        <>
          <div className="full-vote__header">
            <div className="full-vote__summary">{summary}</div>
            <button
              type="button"
              className="full-vote__toggle full-vote__toggle--compact"
              onClick={() => setExpanded(false)}
              aria-expanded={true}
            >
              Hide ▴
            </button>
          </div>
          <div className="full-vote__controls">
            <label className="full-vote__control">
              <span>Group by</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                {mode === "rollCall" && <option value="vote">Vote</option>}
                <option value="party">Party</option>
                <option value="district">District #</option>
              </select>
            </label>
            {mode === "rollCall" && (
              <label className="full-vote__control">
                <span>Filter</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as VoteFilter)}
                >
                  <option value="all">All votes</option>
                  <option value="yea">Yea only</option>
                  <option value="nay">Nay only</option>
                  <option value="nv">Not voting / missing</option>
                </select>
              </label>
            )}
            <label className="full-vote__control full-vote__control--search">
              <span>Search</span>
              <input
                type="search"
                placeholder="name or district #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <span className="full-vote__count">
              showing {filteredCount} of {totalCount}
            </span>
          </div>
          <div className="full-vote__groups">
            {groups.map((g) => (
              <div className="full-vote__group" key={g.label}>
                <div className="full-vote__group-title">{g.label}</div>
                <ul className="full-vote__rows">
                  {g.rows.map((r) => (
                    <li key={`${chamber}-${r.district}`}>
                      <button
                        type="button"
                        className="full-vote__row"
                        onClick={() =>
                          onSelectDistrict?.(r.district, chamber)
                        }
                        title={`Open district popup for ${chamber === "Senate" ? "SD" : "HD"}-${r.district}`}
                      >
                        <VotePill vote={r.vote} />
                        <span
                          className={`popup__party popup__party--${r.party.toLowerCase()}`}
                        >
                          {r.party}
                        </span>
                        <span className="full-vote__name">{r.name}</span>
                        <span className="full-vote__district">
                          {chamber === "Senate" ? "SD" : "HD"}-{r.district}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {filteredCount === 0 && (
              <div className="full-vote__empty">
                No members match your filter. Clear the search or
                widen the filter to see the rest of the roster.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

/** Same color language as the popup vote pills, just a smaller chip. */
const VotePill = ({ vote }: { vote: Vote }) => {
  if (vote === "Yea" || vote === "Nay") {
    return (
      <span
        className="full-vote__pill"
        style={{ background: VOTE_COLORS[vote] }}
      >
        {vote}
      </span>
    );
  }
  if (vote === "Prime") {
    return (
      <span
        className="full-vote__pill"
        style={{ background: COSPONSOR_FILL }}
      >
        Prime
      </span>
    );
  }
  if (vote === "Cosponsor") {
    return (
      <span
        className="full-vote__pill"
        style={{ background: COSPONSOR_FILL }}
      >
        Cosp.
      </span>
    );
  }
  // NV / ?
  return <span className="full-vote__pill full-vote__pill--none">—</span>;
};
