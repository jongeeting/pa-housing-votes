"""Fetch a roll call vote from palegis.us and parse it to JSON.

Two modes:

* Floor votes:
    uv run python scripts/fetch_rollcall.py --session 2025 --chamber house --rc-num 1054
  URL: /{chamber}/roll-calls/summary?sessYr=X&sessInd=0&rcNum=Y
  Output: pipeline/data/rollcalls/{session}-{chamber}-rc{rcnum}.json

* Committee votes:
    uv run python scripts/fetch_rollcall.py --session 2025 --chamber senate \\
        --committee-code 35 --committee-rc-id 997
  URL: /{chamber}/committees/roll-call-votes/vote-list/vote-summary
          ?committeecode=X&rollcallid=Y&sessYr=Z&sessInd=0
  Output: pipeline/data/rollcalls/{session}-{chamber}-cmte{code}-rc{id}.json

The JSON captures the full member-by-member roll plus bill metadata.
palegis.us rejects requests without a browser-style User-Agent, so we
send a Chrome UA. Raw HTML is committed alongside the JSON so the parser
can be re-run without re-fetching, and so palegis structure changes are
visible in git diffs.

Committee-vote pages don't display district or party inline. This
script looks those up against the Senate + House member rosters in
src/data/members/, keyed by the bio-id parsed from the member link.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("fetch_rollcall")

PIPELINE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = PIPELINE_DIR / "data"
RAW_DIR = DATA_DIR / "raw" / "rollcalls"
OUT_DIR = DATA_DIR / "rollcalls"

CHROME_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Vote date appears as "Wednesday May 6, 2026" alongside a 3:15 PM time.
VOTE_DATE_RE = re.compile(
    r"(?P<weekday>\w+)\s+(?P<month>\w+)\s+(?P<day>\d+),\s+(?P<year>\d{4})"
)
TIME_RE = re.compile(r"(\d{1,2}:\d{2}\s*[AP]M)")
BILL_NUM_RE = re.compile(r"/legislation/bills/\d+/(\w+)")
PN_RE = re.compile(r"PN\s+(\d+)")
AMENDMENT_RE = re.compile(r"A\d{4,5}")
BIO_RE = re.compile(r"/(house|senate)/members/bio/(\d+)/(rep|sen)-([a-z0-9\-]+)")

# Suffixes that should be stripped from displayName before taking the surname.
NAME_SUFFIXES = {"Jr.", "Jr", "Sr.", "Sr", "II", "III", "IV", "V"}


def _natural_surname(display_name: str) -> str | None:
    """Take the human-readable surname from displayName.

    "John Inglis III" → "Inglis", "Ismail Smith-Wade-El" → "Smith-Wade-El",
    "Johanny Cepeda-Freytiz" → "Cepeda-Freytiz", "Joseph D'Orsie" → "D'Orsie".

    Palegis's disambiguated print form ("HARRIS, J.", "C. FREYTIZ") is
    deliberately NOT used — the website displays human names.
    """
    if not display_name:
        return None
    tokens = display_name.split()
    while tokens and tokens[-1] in NAME_SUFFIXES:
        tokens.pop()
    return tokens[-1] if tokens else None


def _slugify(display_name: str) -> str:
    """Build a URL-safe slug from a member's display name.

    Palegis publishes slugs in bio hrefs (e.g. rep-john-inglis-iii), but
    their HTML quoting is broken for names containing apostrophes —
    href='/.../rep-la'tasha-mayes' truncates at the apostrophe. We
    therefore synthesize our own slug from the display name instead of
    trusting palegis's href.

    "La'Tasha Mayes" → "la-tasha-mayes", "Joseph D'Orsie" → "joseph-d-orsie",
    "Timothy J. O'Neal" → "timothy-j-o-neal".
    """
    lowered = display_name.lower()
    # Replace anything that isn't a-z0-9 with a hyphen, collapse runs.
    slug = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return slug


def fetch_html(session: str, chamber: str, rc_num: int, refetch: bool) -> Path:
    url = (
        f"https://www.palegis.us/{chamber}/roll-calls/summary"
        f"?sessYr={session}&sessInd=0&rcNum={rc_num}"
    )
    raw_path = RAW_DIR / f"{session}-{chamber}-rc{rc_num}.html"
    raw_path.parent.mkdir(parents=True, exist_ok=True)

    if raw_path.exists() and not refetch:
        log.info("Raw HTML cached at %s (use --refetch to re-download)", raw_path)
        return raw_path

    log.info("Fetching %s", url)
    resp = requests.get(url, headers={"User-Agent": CHROME_UA}, timeout=30)
    resp.raise_for_status()
    raw_path.write_text(resp.text, encoding="utf-8")
    log.info("Saved raw HTML to %s (%d bytes)", raw_path, len(resp.text))
    return raw_path


def fetch_committee_html(
    session: str, chamber: str, committee_code: int, rollcall_id: int, refetch: bool
) -> Path:
    """Fetch a committee roll-call vote page.

    URL pattern differs from floor votes:
      /{chamber}/committees/roll-call-votes/vote-list/vote-summary
          ?committeecode=X&rollcallid=Y&sessYr=Z&sessInd=0
    """
    url = (
        f"https://www.palegis.us/{chamber}/committees/roll-call-votes"
        f"/vote-list/vote-summary?committeecode={committee_code}"
        f"&rollcallid={rollcall_id}&sessYr={session}&sessInd=0"
    )
    raw_path = (
        RAW_DIR
        / f"{session}-{chamber}-cmte{committee_code}-rc{rollcall_id}.html"
    )
    raw_path.parent.mkdir(parents=True, exist_ok=True)

    if raw_path.exists() and not refetch:
        log.info("Raw HTML cached at %s (use --refetch to re-download)", raw_path)
        return raw_path

    log.info("Fetching %s", url)
    resp = requests.get(url, headers={"User-Agent": CHROME_UA}, timeout=30)
    resp.raise_for_status()
    raw_path.write_text(resp.text, encoding="utf-8")
    log.info("Saved raw HTML to %s (%d bytes)", raw_path, len(resp.text))
    return raw_path


# --- Roster lookup ---------------------------------------------------------
# Committee-vote pages don't display district or party inline. We look those
# up from the canonical rosters in src/data/members/pa-*.ts, matching by
# bio-id (the numeric ID palegis embeds in every member link).

ROSTER_TS_FILES = {
    "senate": PIPELINE_DIR.parent / "src" / "data" / "members" / "pa-senate-2025.ts",
    "house": PIPELINE_DIR.parent / "src" / "data" / "members" / "pa-house-2025.ts",
}


def _load_roster_by_bioid(chamber: str) -> dict[str, dict]:
    """Parse a TS roster file into a bioId -> member dict.

    Returns {}: bio-id -> {"id", "district", "party", "displayName",
                           "lastName", "slug"}
    """
    path = ROSTER_TS_FILES[chamber]
    text = path.read_text(encoding="utf-8")

    # Members are declared as consecutive object literals inside an array.
    # Grab each { ... } block that contains an id/bioUrl pair.
    member_re = re.compile(r"\{[^{}]*id:\s*\"([^\"]+)\"[^{}]*\}", re.DOTALL)
    field_re = re.compile(r'(\w+):\s*"([^"]*)"')
    bio_id_re = re.compile(r"/members/bio/(\d+)/")

    out: dict[str, dict] = {}
    for m in member_re.finditer(text):
        block = m.group(0)
        fields = dict(field_re.findall(block))
        bio_url = fields.get("bioUrl", "")
        bm = bio_id_re.search(bio_url)
        if not bm:
            continue
        bio_id = bm.group(1)
        # Reconstruct the palegis-slug from the id field
        # (e.g. "senate-2025-david-g-argall" -> "david-g-argall")
        member_id = fields.get("id", "")
        slug = re.sub(r"^(senate|house)-\d+-", "", member_id)
        out[bio_id] = {
            "id": member_id,
            "district": fields.get("district"),
            "party": fields.get("party"),
            "displayName": fields.get("fullName"),
            "lastName": fields.get("lastName"),
            "slug": slug,
        }
    return out


def parse_member(block) -> dict | None:
    """Parse a single .rc-member block."""
    anchor = block.select_one("a[href*='/members/bio/']")
    if not anchor:
        return None
    href = anchor.get("href", "")
    m = BIO_RE.search(href)
    if not m:
        return None
    bio_id = m.group(2)

    display = re.sub(r"^Rep\.\s+|^Sen\.\s+", "", anchor.get_text(strip=True))
    # Synthesize slug from display name rather than trusting palegis's
    # broken-quoting href slug; see _slugify docstring.
    slug = _slugify(display)

    party_badge = block.select_one("span.badge[class*='bg-party-']")
    party = None
    if party_badge:
        for cls in party_badge.get("class", []):
            if cls.startswith("bg-party-"):
                party = cls.split("-")[-1]
                break

    district = None
    if party_badge and party_badge.parent:
        txt = party_badge.parent.get_text(" ", strip=True)
        dm = re.search(r"District\s+(\d+)", txt)
        if dm:
            district = dm.group(1)

    vote_badge = block.select_one(
        "span.badge[title='Yea'], span.badge[title='Nay'], "
        "span.badge[title='Not Voting'], span.badge[title='Leave']"
    )
    vote = vote_badge.get("title") if vote_badge else None

    last_name = _natural_surname(display)

    return {
        "bioId": bio_id,
        "slug": slug,
        "displayName": display,
        "lastName": last_name,
        "party": party,
        "district": district,
        "vote": vote,
    }


def parse_header(soup: BeautifulSoup) -> dict:
    out: dict = {}

    # Vote date and time
    date_anchor = soup.select_one("a[href*='/roll-calls?']")
    if date_anchor:
        parent_text = date_anchor.parent.get_text(" ", strip=True) if date_anchor.parent else ""
        dm = VOTE_DATE_RE.search(parent_text)
        if dm:
            # palegis switched (mid-2026?) from "Wednesday May 6, 2026"
            # to "Monday Jun 1, 2026" — try full month name first, fall
            # back to abbreviated. If both fail, leave voteDate unset
            # rather than crash; the downstream MapItem registration
            # can fill it from the operator's known date.
            for fmt in ("%B %d %Y", "%b %d %Y"):
                try:
                    dt = datetime.strptime(
                        f"{dm.group('month')} {dm.group('day')} {dm.group('year')}",
                        fmt,
                    )
                    out["voteDate"] = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
        tm = TIME_RE.search(parent_text)
        if tm:
            out["voteTime"] = tm.group(1)

    # Bill: anchor like /legislation/bills/2025/hb2186
    bill_anchor = soup.select_one("a[href*='/legislation/bills/']")
    if bill_anchor:
        bm = BILL_NUM_RE.search(bill_anchor.get("href", ""))
        if bm:
            bill_id = bm.group(1).upper()
            bill: dict = {"id": bill_id, "label": bill_anchor.get_text(strip=True)}
            # PN + amendments live in the same column as the bill anchor
            col = bill_anchor.find_parent("div", class_="col-lg-4")
            if col:
                col_text = col.get_text(" ", strip=True)
                pn = PN_RE.search(col_text)
                if pn:
                    bill["printerNumber"] = pn.group(1)
                amendments = AMENDMENT_RE.findall(col_text)
                if amendments:
                    bill["amendments"] = amendments
            out["bill"] = bill

    # Short title
    short = soup.select_one("#shortTitle")
    if short:
        out["shortTitle"] = short.get_text(strip=True)

    # Tallies: look for the vote summary card. Each tally is in a card item.
    for label in ("Yea", "Nay", "No Vote", "Leave"):
        # Find a node whose text contains the label and a sibling/parent with a count.
        # The vote summary structure has labels followed by numeric counts.
        pass  # Tallies will be computed from members; we don't trust the header card layout.

    return out


def parse_committee(
    raw_path: Path,
    session: str,
    chamber: str,
    committee_code: int,
    rollcall_id: int,
) -> dict:
    """Parse a committee vote page.

    HTML structure is different from floor votes:
      <li class="list-group-item ...">
        <div class="row ... voteRow ...">
          <div class="col-auto fw-medium memberVote flex-grow-1">
            <a href="/senate/members/bio/{bioId}/sen-{slug}">
              Sen. Firstname Lastname
            </a>
          </div>
          <div class="col-auto">
            <span class="badge text-bg-success" title="Yea">...</span>
            OR
            <span class="badge text-bg-danger" title="Nay">...</span>
          </div>
        </div>
      </li>

    District + party don't appear on the page; we look them up against
    the roster by bio-id.
    """
    html = raw_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    roster_by_bioid = _load_roster_by_bioid(chamber)

    members: list[dict] = []
    seen: set[str] = set()
    for row in soup.select("div.voteRow"):
        anchor = row.select_one("a[href*='/members/bio/']")
        if not anchor:
            continue
        href = anchor.get("href", "").strip()
        bm = BIO_RE.search(href)
        if not bm:
            continue
        bio_id = bm.group(2)
        if bio_id in seen:
            continue
        seen.add(bio_id)

        display = re.sub(
            r"^Rep\.\s+|^Sen\.\s+", "", anchor.get_text(" ", strip=True)
        )

        # Vote badge sits in a sibling column of the row.
        vote_badge = row.select_one(
            "span.badge[title='Yea'], span.badge[title='Nay'], "
            "span.badge[title='Not Voting'], span.badge[title='Leave'], "
            "span.badge[title='Absent']"
        )
        vote = vote_badge.get("title") if vote_badge else None

        roster = roster_by_bioid.get(bio_id, {})
        members.append(
            {
                "bioId": bio_id,
                # Prefer the roster's canonical id if we have it (keeps
                # memberId aligned with the roster + downstream lookups);
                # otherwise fall back to a slug synthesized from the row.
                "slug": roster.get("slug") or _slugify(display),
                "displayName": roster.get("displayName") or display,
                "lastName": roster.get("lastName") or _natural_surname(display),
                "party": roster.get("party"),
                "district": roster.get("district"),
                "vote": vote,
            }
        )
        if not roster:
            log.warning(
                "  no roster match for bioId=%s (%s) — district/party left null",
                bio_id,
                display,
            )

    # Compute tallies from member rows.
    tallies = {"yea": 0, "nay": 0, "notVoting": 0, "leave": 0, "missing": 0}
    for m in members:
        v = m["vote"]
        if v == "Yea":
            tallies["yea"] += 1
        elif v == "Nay":
            tallies["nay"] += 1
        elif v == "Not Voting":
            tallies["notVoting"] += 1
        elif v == "Leave":
            tallies["leave"] += 1
        else:
            tallies["missing"] += 1

    # Header info — committee pages have a different layout, but a lot of
    # the same primitives (bill anchor, date, PN). Try the shared parser
    # first and fill in whatever comes back.
    header = parse_header(soup)

    return {
        "session": f"{session}-0",
        "chamber": chamber,
        "kind": "committee",
        "committeeCode": committee_code,
        "rollCallId": rollcall_id,
        "sourceUrl": (
            f"https://www.palegis.us/{chamber}/committees/roll-call-votes"
            f"/vote-list/vote-summary?committeecode={committee_code}"
            f"&rollcallid={rollcall_id}&sessYr={session}&sessInd=0"
        ),
        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        **header,
        "tallies": tallies,
        "members": members,
    }


def parse(raw_path: Path, session: str, chamber: str, rc_num: int) -> dict:
    html = raw_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    header = parse_header(soup)

    members: list[dict] = []
    seen: set[str] = set()
    for block in soup.select("div.rc-member"):
        m = parse_member(block)
        if not m:
            continue
        if m["bioId"] in seen:
            continue
        seen.add(m["bioId"])
        members.append(m)

    # Compute tallies from member rows (more reliable than scraping the summary card).
    tallies = {"yea": 0, "nay": 0, "notVoting": 0, "leave": 0, "missing": 0}
    for m in members:
        v = m["vote"]
        if v == "Yea":
            tallies["yea"] += 1
        elif v == "Nay":
            tallies["nay"] += 1
        elif v == "Not Voting":
            tallies["notVoting"] += 1
        elif v == "Leave":
            tallies["leave"] += 1
        else:
            tallies["missing"] += 1

    return {
        "session": f"{session}-0",
        "chamber": chamber,
        "rcNum": rc_num,
        "sourceUrl": (
            f"https://www.palegis.us/{chamber}/roll-calls/summary"
            f"?sessYr={session}&sessInd=0&rcNum={rc_num}"
        ),
        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        **header,
        "tallies": tallies,
        "members": members,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--session", required=True, help="e.g. 2025 (start year of 2-year session)")
    ap.add_argument("--chamber", required=True, choices=["house", "senate"])
    ap.add_argument("--rc-num", type=int, help="palegis floor roll-call number")
    ap.add_argument("--committee-code", type=int, help="committee code (e.g. 35 for Senate Urban Affairs & Housing)")
    ap.add_argument("--committee-rc-id", type=int, help="committee rollcallid")
    ap.add_argument("--refetch", action="store_true", help="bypass cached raw HTML")
    args = ap.parse_args()

    is_committee = args.committee_code is not None or args.committee_rc_id is not None
    if is_committee:
        if args.committee_code is None or args.committee_rc_id is None:
            ap.error("--committee-code and --committee-rc-id must be used together")
        raw_path = fetch_committee_html(
            args.session,
            args.chamber,
            args.committee_code,
            args.committee_rc_id,
            args.refetch,
        )
        parsed = parse_committee(
            raw_path,
            args.session,
            args.chamber,
            args.committee_code,
            args.committee_rc_id,
        )
        out_path = (
            OUT_DIR
            / f"{args.session}-{args.chamber}-cmte{args.committee_code}-rc{args.committee_rc_id}.json"
        )
    else:
        if args.rc_num is None:
            ap.error("--rc-num is required for floor votes")
        raw_path = fetch_html(args.session, args.chamber, args.rc_num, args.refetch)
        parsed = parse(raw_path, args.session, args.chamber, args.rc_num)
        out_path = OUT_DIR / f"{args.session}-{args.chamber}-rc{args.rc_num}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(parsed, indent=2) + "\n", encoding="utf-8")

    t = parsed["tallies"]
    log.info("Wrote %s", out_path)
    log.info(
        "  %d members; Yea=%d Nay=%d NV=%d Leave=%d missing=%d",
        len(parsed["members"]),
        t["yea"],
        t["nay"],
        t["notVoting"],
        t["leave"],
        t["missing"],
    )
    if t["missing"]:
        log.warning("Some member rows had no vote captured; inspect %s", out_path)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
