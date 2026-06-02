"""Fetch a roll call vote from palegis.us and parse it to JSON.

Usage:
    cd pipeline
    uv run python scripts/fetch_rollcall.py --session 2025 --chamber house --rc-num 1054

Outputs:
    pipeline/data/raw/rollcalls/{session}-{chamber}-rc{rcnum}.html
    pipeline/data/rollcalls/{session}-{chamber}-rc{rcnum}.json

The JSON captures the full member-by-member roll plus bill metadata.
palegis.us rejects requests without a browser-style User-Agent, so we
send a Chrome UA. Raw HTML is committed alongside the JSON so the parser
can be re-run without re-fetching, and so palegis structure changes are
visible in git diffs.
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
    ap.add_argument("--rc-num", required=True, type=int, help="palegis roll call number")
    ap.add_argument("--refetch", action="store_true", help="bypass cached raw HTML")
    args = ap.parse_args()

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
