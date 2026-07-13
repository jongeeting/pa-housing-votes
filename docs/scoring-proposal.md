# Member scoring system — proposal

**Status:** Pinned for later. Drafted June 2, 2026 in chat with the
project owner. Build hasn't started.

Use this file as the starting point when we come back to scoring. The
proposal below is the version that was discussed and partly agreed
on; revisit the open questions at the bottom before any code lands.

---

## Core principle

**Don't build "one number." Build a transparent scorecard with named
components.** A single composite score is reductive and fragile: when
one component is contested, the whole score is contested. Multiple
components let different audiences (lobbyist, coalition organizer,
reporter, constituent) weight them differently for their own
purposes.

---

## Proposed component dimensions

For each member, per session:

### 1. Vote score — floor votes

| Action | Points |
|---|---:|
| Yea on Final Passage of a tracked housing bill | **+5** |
| Yea on 2nd Consideration | **+2** |
| Nay on Final Passage | **−5** |
| Nay on 2nd Consideration | **−2** |
| Nay on a *weakening amendment* (when identifiable) | **+1** |
| Yea on a weakening amendment | **−1** |
| Absent / Not Voting | **0** (no penalty) |

"Weakening amendment" is the contestable piece. See the proposed
methodology below.

### 2. Sponsor score — proactive championing

| Action | Points |
|---|---:|
| Prime sponsor of a tracked housing bill | **+8** per bill |
| Cosponsor of a tracked housing bill | **+2** per bill |
| Cosponsor of a cosponsorship memo (pre-bill) | **+1** |

**Design note (added 2026-07-12).** User directive: cosponsorship
should count clearly less than a Yea on Final Passage, but it should
"add up" — repeated cosponsoring across many bills is a real signal
of a champion. That's what this dimension captures. A member who
cosponsors 8 tracked bills scores +16 here; someone who cosponsors
1 and votes Yea on 3 Final Passages scores +2 (cosponsor) + +15
(votes) = +17. Both read as engaged, ranked appropriately.

### 3. Committee score — advancing bills out of committee

| Action | Points |
|---|---:|
| Yea on a committee vote that advanced a housing bill | **+2** |
| Nay on a committee vote | **−2** |

### 4. Consistency bonus

| Pattern | Bonus |
|---|---:|
| Voted Yea on all tracked floor votes in the session | **+5** |
| Voted Yea on ≥75% of tracked floor votes | **+2** |

### 5. Leadership signal — only when applicable

| Role | Points |
|---|---:|
| Caucus leadership position aligned with housing slate's posture | **+3** |
| Committee chair of a housing-relevant committee | **+3** |

---

## Methodology choices to commit to

### What counts as a "weakening amendment"

This is the contestable judgment in the scoring system. **Proposed
defensible objective rule:**

> An amendment counts as "weakening" for scoring purposes only when
> the **prime sponsor of the underlying bill voted Nay on the
> amendment**. The prime is the best authority on whether an
> amendment weakened or strengthened their own bill; using their
> vote as the signal makes the classification objective rather
> than ours to argue.

Edge cases:
- Prime sponsor is absent for the amendment vote → don't classify
- Multiple primes (rare): require unanimous Nay from primes for
  weakening status
- Bill has no recorded amendment vote (amendment adopted by voice
  vote) → don't classify

### Local-context normalization

Members from inner-suburban Bucks R districts vote with different
local risk than members from Philly D districts. **Tempting to
normalize; methodologically fraught.**

Proposal: **show raw scores + district context separately, don't
blend.** A reader can compare a member's score to the
characteristics of their district visually and form their own
judgment.

### Cross-session aggregation

Career score and per-session score are different things. **Show
both explicitly**, labeled clearly. Don't average them.

### Newly elected members

A freshman with a 5-month record needs a different denominator than
a third-term incumbent. **Show per-vote average alongside totals**
so the reader sees the rate, not just the cumulative.

### Cosponsors who later defected on the floor vote

Should the +2 cosponsor bonus be revoked when the member votes Nay
on the same bill later? **Proposal: don't revoke.** The cosponsorship
was a real signal at the time it was made; the floor vote is a
separate data point. Both belong in the record.

---

## What this would look like on the site

When built (v1):
- New `/scorecard` page with a sortable table of all members, their
  session score, and dimension breakdowns
- Score-computation library at `src/lib/scoring.ts` (one function
  per dimension; pure, testable)

When extended (v2):
- Member detail pages at `/member/<slug>` showing score history,
  every vote, every cosponsorship, dimension breakdown
- Score chip on each district popup showing the member's session
  score with a "see full record →" link
- Score-impact chip on each bill card showing the average score
  impact of voting on this bill

When polished (v3):
- Historical trend lines
- Peer comparison ("member ranks X of N D members on housing")
- Exportable CSV for coalition materials

---

## What I'd push back on (this was previously discussed and agreed)

- **Don't include a "you should vote Yes" pressure score.** The
  site is a scorecard, not an endorsement tracker.
- **Don't grade on a curve / assign letter grades.** Absolute
  thresholds (A–F) get used as political weapons; numbers +
  breakdowns let the reader judge for themselves.
- **Don't include behavior beyond votes / cosponsorship in the
  formal score.** Floor speeches, town halls, member behavior in
  committee — interesting context, not quantifiable in a
  defensible way.

---

## Sample back-of-envelope scores (June 2, 2026 data)

Using the data we had as of the SB 1281 + HB 2109 floor votes on
June 2, 2026:

- **Tarik Khan (D, HD-194)** — prime of HB 2109 (+8), 6
  cosponsorships (+12), Yea on HB 2186 votes (~+12 across both),
  Yea on his own HB 2109 (+5). **~+45 for the session.**
- **John Inglis III (D, HD-38)** — prime of HB 2186 (+8), various
  cosponsorships (+10), Yea on HB 2186 Final Passage (+5), Nay on
  HB 2109 2nd Consideration (−2 base, +1 weakening-amendment
  bonus if A03389 qualifies → −1 net). **~+25 net.**
- **Lisa Borowski (D, HD-168)** — Nay on both HB 2186 + HB 2109
  Final Passage (~−10), other Yeas (+small). **~−3 net.** Useful
  flag without being punitive.
- **Joe Hogan (R, HD-142)** — Yea on HB 2186 Final (+5), cosponsor
  of several bills (+8), Nay on HB 2109 (−5). **~+10.** Cleanest R
  reform voice in the data.
- **Wayne Langerholc (Sen R, SD-35)** — no floor votes on tracked
  bills yet (SB 1346 + SB 1281 haven't reached final passage). Sits
  near 0 until those land. Note: he primed amendments to SB 1281;
  whether to classify those as weakening is exactly the kind of
  judgment call to defer.

---

## Open questions before we build

1. **Dimensions** — right components, or different ones? Should
   "leadership signal" be included or dropped?
2. **Point weights** — any too generous or too punishing?
3. **Weakening-amendment rule** — the "prime sponsor voted Nay"
   proxy was floated but not committed to. Alternative methodologies?
4. **Build order** — v1 only (scorecard page + computation lib)
   on first pass? Or jump straight to score chips on the existing
   district popups?

---

## Implementation notes (when build starts)

- Score computation lives in `src/lib/scoring.ts` — pure functions,
  one per dimension, then a composite `computeMemberScore`
- Data inputs: `ALL_BILLS`, `ALL_MAP_ITEMS`, cosponsor files, vote
  files — all already in src/data/
- For weakening-amendment classification: amendment vote records
  would need to be tracked separately. Currently we only have the
  underlying bill's roll call. Either:
  - Fetch amendment-adoption roll calls when they appear (palegis
    has them), OR
  - Tag amendments manually in the bill record (`weakeningAmendments:
    ["A03389", "A03426"]`) until automated detection works
- Score recomputation on data change: keep it build-time (static
  scores per build, refreshed on every push) rather than runtime
- Member roster source: `src/data/members/pa-house-2025.ts` +
  `pa-senate-2025.ts` (already imported in lib/voteAggregation)
