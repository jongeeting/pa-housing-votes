# Senate nesting math — post-election retarget (Nov 2026)

> **PRELIMINARY.** Uses this term's recorded House votes (kept intact) and
> applies the unofficial, morning-after election results. SD-16 and SD-40
> are still uncalled. Re-verify before acting.

**Status:** internal working note. Companion to
`2026-11-flips-by-region-and-committee.md`. See [[project_nesting_strategy]].

## Method (unchanged — we keep this term's data)

Nesting support = share of a Senate district's **primary-nested** House
districts (land overlap ≥ 0.5, per `computeNestedSupport` /
`nestedHouseDistricts`) that voted **Yea** on a bill's final passage. The
base data is this term's recorded roll calls — **HB 2186** (ADU, rc 1075)
and **HB 2109** (occupancy, rc 1119). We keep those.

The **post-election** column recomputes the same thing after recoding the
six called House flips (HD-18, 44, 88, 137, 142, 160) — all now Democratic —
as Yea. Everything else is held at its recorded vote. So each senator gets a
"this term → post-election" nested-support reading.

## What the House flips did to the nesting

Only three Senate districts' nested support actually moved — the flips that
turned a *Nay* House seat into a *Yea* one (HD-18, HD-88, HD-160), and only
where that seat is primary-nested:

| SD | Senator (now) | HB 2186 this term → post-election | Driver |
|---|---|---|---|
| SD-9 | Kane (D) | 67% → **100%** (+33) | HD-160 flip |
| SD-6 | Albillar (D) | 50% → **75%** (+25) | HD-18 flip (flipped SD) |
| SD-34 | Rothman (R) | 67% → **83%** (+17) | HD-88 flip |

The other three flips (HD-44, 137, 142) were already Yea, so they don't move
the math — but they do mean those Yea votes now come from Democrats who will
hold, not Republicans who might wobble.

## Prior targets — all three survived, all still nest well

Our pre-election targets (Ward SD-30, Langerholc SD-35, Picozzi SD-5) all
**held their seats** — the Senate flipped on *other* districts. They remain
valid, but the ask changes (see below).

| SD | Senator | HB 2186 | HB 2109 | Note |
|---|---|---|---|---|
| SD-35 | Langerholc (R) | 100% | 50% | Held. Full ADU delegation. |
| SD-5 | Picozzi (R) | 75% | 75% | Held. **Loses the Urban Affairs & Housing gavel** to Saval. |
| SD-30 | Ward, Judy (R) | 50% | 75% | Held. Stronger on occupancy than ADU. |

## Retargeted lists

### A. Surviving Republicans on pro-reform delegations — "don't block / vote yes"
Under a Democratic majority the ask shifts from *"move the bill"* to *"don't
obstruct it, and give it a bipartisan margin."* These R senators' own House
delegations back ADUs, which is the cover to pitch them:

| SD | Senator | HB 2186 nest | HB 2109 nest |
|---|---|---|---|
| SD-35 | Langerholc | **100%** | 50% |
| SD-37 | Robinson | **100%** | 67% |
| SD-34 | Rothman | **83%** (rose) | 50% |
| SD-5 | Picozzi | 75% | 75% |
| SD-49 | Laughlin | 75% | 25% |
| SD-25 | Dush | 75% | 25% |
| SD-39 | Ward, Kim | 67% | 33% |
| SD-30 | Ward, Judy | 50% | 75% |

### B. New Democratic allies from the flips (the Yea base grows)
| SD | New senator | HB 2186 | HB 2109 | Status |
|---|---|---|---|---|
| SD-40 | Wrightson (D) | 75% | 75% | uncalled — strong nest |
| SD-6 | Albillar (D) | 75% | 50% | called — rose from flip |
| SD-24 | Thomas (D) | 67% | 67% | called |

### C. Weak-nest Democrat — arm, don't assume
| SD | Senator | HB 2186 | HB 2109 | Note |
|---|---|---|---|---|
| SD-16 | Pinsley (D) | 20% | 40% | uncalled. A Democrat in R-leaning House turf — his delegation mostly voted Nay, so he gets the least "your district backs this" cover of any D. Give him the member-by-member breakdown. |

### D. The one loss
**SD-36 (Lancaster)** flipped D→R (Malone → Tom Jones). Nest is weak anyway
(HB 2186 40%, HB 2109 20%), so we lose a reliable Yea but not a nesting
argument.

## Retarget summary

- **The chokepoint is gone.** With a Democratic majority and Saval chairing
  Urban Affairs & Housing, nesting is no longer about prying a bill out of a
  hostile committee. It's about (1) a durable bipartisan floor margin and
  (2) protecting the new, thin majority.
- **Bipartisan margin:** lead with Langerholc (35), Robinson (37), Rothman
  (34 — now 83%), Picozzi (5). Their delegations give them cover; Rothman and
  Picozzi especially, as the two highest-nest Rs outside leadership.
- **Protect the majority:** Pinsley (SD-16, if he holds) is the one Democrat
  with a hostile delegation — he needs arming, not assuming.
- **ADU vs occupancy still diverge.** HB 2109 nests are consistently lower
  than HB 2186 — occupancy reform remains the harder sell even where ADUs
  poll the delegation well (Langerholc 100%/50%, Laughlin & Dush 75%/25%).

## To-dos
1. Resolve SD-16 and SD-40; both change the D majority and the lists above.
2. Re-run with cosponsor data folded in (method supports yea + cosponsor);
   this note uses floor votes only.
3. Rebuild the SD-nesting choropleth with the post-election House delegation.
