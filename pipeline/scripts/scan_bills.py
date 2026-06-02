"""Scan tracked bills against palegis for stale data.

Run via the /scan-bills skill or directly:
    cd ~/projects/pa-housing-votes
    uv run --project pipeline python pipeline/scripts/scan_bills.py

For every current-session bill in src/data/bills/all-bills.ts:
- fetch the palegis info page
- parse latest PN, last-action text, roll-call links, current cosponsors
- diff against the site record (status, lastActionDate, billTextUrl PN)
- diff against the local cosponsor file (introducer list parsed from PDF)
- for any delta, also fetch the new PDF + each new roll call's data

Outputs two files in pipeline/data/scan-results/<YYYY-MM-DD>/:
- summary.json   — structured machine-readable per-bill delta records
- report.md      — human-readable review document with proposed update
                   text for each delta, intended for the user to skim
                   before approving changes via the /scan-bills skill

Idempotent: HTML responses are cached under pipeline/data/cache/bills/
with the date in the filename, so re-running on the same day reuses
the cache; the next day fetches fresh.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Paths + constants
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
ALL_BILLS_TS = REPO_ROOT / "src" / "data" / "bills" / "all-bills.ts"
COSPONSORS_DIR = REPO_ROOT / "src" / "data" / "cosponsors"
VOTES_DIR = REPO_ROOT / "src" / "data" / "votes"
CACHE_DIR = REPO_ROOT / "pipeline" / "data" / "cache" / "bills"
RAW_RC_DIR = REPO_ROOT / "pipeline" / "data" / "rollcalls"
SCAN_OUT_BASE = REPO_ROOT / "pipeline" / "data" / "scan-results"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

CURRENT_SESSION = "2025-2026"
SESSION_YEAR_ARG = "2025"
TODAY = datetime.now().strftime("%Y-%m-%d")
SCAN_OUT_DIR = SCAN_OUT_BASE / TODAY
SCAN_OUT_DIR.mkdir(parents=True, exist_ok=True)

MONTH_FULL = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]
MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# ---------------------------------------------------------------------------
# Site-record parsing
# ---------------------------------------------------------------------------
def parse_local_bills() -> dict[str, dict[str, Any]]:
    """Crack open all-bills.ts and return one dict per current-session bill."""
    text = ALL_BILLS_TS.read_text()
    bills: dict[str, dict] = {}
    bill_pattern = re.compile(
        r"export const (HB\d+|SB\d+|HR\d+|SR\d+)\s*:[^{]*\{(.*?)\n\};",
        re.DOTALL,
    )
    for m in bill_pattern.finditer(text):
        bid = m.group(1)
        body = m.group(2)
        rec: dict[str, Any] = {"id": bid}
        for field in ("label", "status", "lastActionDate", "lastActionNote",
                       "billTextUrl", "sourceUrl", "session", "shortTitle",
                       "primeSponsorDistrict", "committee"):
            mm = re.search(rf'{field}:\s*\n?\s*"((?:[^"\\]|\\.)*?)"', body)
            if mm:
                rec[field] = mm.group(1)
        # Extract latest PN from billTextUrl if present
        if "billTextUrl" in rec:
            pn_m = re.search(r"/PN(\d+)", rec["billTextUrl"])
            if pn_m:
                rec["localPN"] = pn_m.group(1)
        bills[bid] = rec
    return {k: v for k, v in bills.items() if v.get("session") == CURRENT_SESSION}


def parse_local_cosponsors(billid: str) -> list[dict] | None:
    """Read src/data/cosponsors/<billid>-cosponsors.ts and return the names."""
    path = COSPONSORS_DIR / f"{billid.lower()}-cosponsors.ts"
    if not path.exists():
        return None
    text = path.read_text()
    out = []
    # All { name: "...", district: "...", party: "..." } entries (incl. prime)
    for n, d, p in re.findall(
        r'\{\s*name:\s*"([^"]+)",\s*district:\s*"([^"]+)",\s*party:\s*"([^"]+)"',
        text,
    ):
        out.append({"name": n, "district": d, "party": p})
    return out


# ---------------------------------------------------------------------------
# Palegis fetching
# ---------------------------------------------------------------------------
def _cache_path(name: str) -> Path:
    return CACHE_DIR / f"{name}-{TODAY}.html"


def fetch_url(url: str, cache_name: str | None = None) -> str:
    """GET a URL with caching to disk."""
    if cache_name:
        cache = _cache_path(cache_name)
        if cache.exists():
            return cache.read_text()
    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    if cache_name:
        _cache_path(cache_name).write_text(r.text)
    return r.text


def fetch_bill_info(billid: str) -> str:
    return fetch_url(
        f"https://www.palegis.us/legislation/bills/{SESSION_YEAR_ARG}/{billid.lower()}",
        cache_name=f"{billid}-info",
    )


def fetch_bill_pdf(billid: str, pn: str) -> Path:
    """Cache + return a path to the bill's PN PDF."""
    file_id = billid if billid.startswith(("HB", "SB")) else f"{billid[:2]}{int(billid[2:]):04d}"
    url = f"https://www.palegis.us/legislation/bills/text/PDF/{SESSION_YEAR_ARG}/0/{file_id}/PN{pn}"
    dest = CACHE_DIR / f"{billid}-PN{pn}.pdf"
    if not dest.exists():
        r = requests.get(url, headers=UA, timeout=60)
        r.raise_for_status()
        dest.write_bytes(r.content)
    return dest


# ---------------------------------------------------------------------------
# Palegis parsing
# ---------------------------------------------------------------------------
def parse_palegis_info(html: str) -> dict[str, Any]:
    """Pull structured fields from the bill info page."""
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text("\n", strip=True)
    chunks = text.split("\n")

    info: dict[str, Any] = {"pns": [], "rcs": [], "last_action_text": None,
                            "last_action_date": None}

    # Last Action: usually a line followed by date + chamber + flags
    for i, ln in enumerate(chunks):
        if ln == "Last Action:" and i + 1 < len(chunks):
            la = chunks[i + 1]
            info["last_action_text"] = la
            # Parse date out
            dm = re.search(r"(\w+)\s+(\d{1,2}),\s+(\d{4})", la)
            if dm:
                mon, day, yr = dm.groups()
                month_idx = None
                if mon in MONTH_FULL:
                    month_idx = MONTH_FULL.index(mon)
                elif mon in MONTH_SHORT:
                    month_idx = MONTH_SHORT.index(mon)
                if month_idx is not None:
                    info["last_action_date"] = f"{yr}-{month_idx + 1:02d}-{int(day):02d}"
            break

    # Printer's numbers — palegis shows them newest first
    for ln in chunks:
        if ln.startswith("PN "):
            info["pns"].append(ln.replace("PN ", "").strip())
    # Some pages list 'Top' then individual PN lines; dedupe while preserving order
    seen = set()
    info["pns"] = [p for p in info["pns"] if not (p in seen or seen.add(p))]

    # Roll-call references (committee + floor)
    for a in soup.find_all("a"):
        href = a.get("href", "")
        t = a.get_text(strip=True)
        if "roll-call" not in href.lower() or not t:
            continue
        rc_info = {"href": href, "text": t}
        # Senate floor
        sf_m = re.search(r"rcNum=(\d+)", href)
        if sf_m and "senate/roll-calls/summary" in href:
            rc_info["chamber"] = "senate"
            rc_info["type"] = "floor"
            rc_info["rcNum"] = sf_m.group(1)
        # House floor
        elif sf_m and "house/roll-calls/summary" in href:
            rc_info["chamber"] = "house"
            rc_info["type"] = "floor"
            rc_info["rcNum"] = sf_m.group(1)
        # Committee
        elif "committees/roll-call-votes" in href:
            rcid_m = re.search(r"rollcallid=(\d+)", href)
            rc_info["type"] = "committee"
            if rcid_m:
                rc_info["rollcallid"] = rcid_m.group(1)
            if "house/committees" in href:
                rc_info["chamber"] = "house"
            elif "senate/committees" in href:
                rc_info["chamber"] = "senate"
        info["rcs"].append(rc_info)

    # Drop duplicates (palegis renders each rc multiple times for tally counts)
    deduped = []
    seen_keys = set()
    for rc in info["rcs"]:
        key = rc.get("rcNum") or rc.get("rollcallid") or rc.get("href")
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(rc)
    info["rcs"] = deduped

    info["latestPN"] = info["pns"][0] if info["pns"] else None
    return info


def parse_introducers_from_pdf(pdf_path: Path) -> list[str] | None:
    """Pull the 'INTRODUCED BY ...' list out of a bill PDF."""
    try:
        from pdfminer.high_level import extract_text  # type: ignore
    except ImportError:
        return None
    text = extract_text(str(pdf_path))
    m = re.search(
        r"INTRODUCED BY\s+(.+?)\s*,\s*"
        r"(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2},\s+\d{4}",
        text,
        re.DOTALL,
    )
    if not m:
        return None
    blob = m.group(1)
    blob = re.sub(r"\s+", " ", blob)
    blob = re.sub(r"\s+AND\s+", ", ", blob)
    tokens = [n.strip().rstrip(".") for n in blob.split(",") if n.strip()]
    return tokens


# ---------------------------------------------------------------------------
# Delta detection
# ---------------------------------------------------------------------------
def list_existing_rc_files(billid: str) -> list[str]:
    """Return any rc-number strings already represented in src/data/votes/.

    Heuristic: look for files mentioning the bill id and extract rc numbers
    from any `sourceUrl` lines they contain. Misses don't break the scan;
    they just mean we may show a "new rc" the user already has.
    """
    found = set()
    if not VOTES_DIR.exists():
        return []
    for f in VOTES_DIR.iterdir():
        if f.suffix != ".ts":
            continue
        text = f.read_text()
        if billid not in text:
            continue
        for rc in re.findall(r"rcNum=(\d+)", text):
            found.add(rc)
    return sorted(found)


def compare_bill(billid: str, local: dict, palegis: dict) -> dict[str, Any]:
    """Identify what's stale on the site relative to palegis. Returns None-equivalent
    (empty 'changes') if nothing differs."""
    delta: dict[str, Any] = {"id": billid, "label": local.get("label", billid),
                              "changes": []}
    local_pn = local.get("localPN")
    palegis_pn = palegis.get("latestPN")
    if palegis_pn and local_pn != palegis_pn:
        delta["changes"].append({
            "field": "billTextUrl",
            "kind": "pn_bump",
            "from": local_pn,
            "to": palegis_pn,
        })

    if palegis.get("last_action_date") and palegis["last_action_date"] != local.get("lastActionDate"):
        delta["changes"].append({
            "field": "lastActionDate",
            "kind": "date_change",
            "from": local.get("lastActionDate"),
            "to": palegis["last_action_date"],
            "palegis_text": palegis.get("last_action_text"),
        })

    # Check for new roll calls. "Known" means either:
    #  - There's a vote TS file for it in src/data/votes/, OR
    #  - The rc number is mentioned in the bill's lastActionNote (covers
    #    the case where we've documented a Senate floor vote in the
    #    note without creating a dedicated TS file — Senate floor votes
    #    aren't currently tracked as individual MapItems).
    #
    # We classify each new rc by actionability:
    #   - House floor → actionable (we have a fetcher; generates a vote
    #     TS file + new MapItem). This kind alone is enough to trigger
    #     a delta on its own.
    #   - Senate floor → informational. We don't have a Senate fetcher,
    #     and Senate floor activity is usually documented in the
    #     bill's lastActionNote rather than as an individual TS file.
    #     Listed in the report but doesn't trigger a delta on its own.
    #   - Committee (either chamber) → informational. Most committee
    #     activity is documented in lastActionNote text. Listed in the
    #     report when other deltas trigger but doesn't trigger a delta
    #     by itself.
    known_rcs = set(list_existing_rc_files(billid))
    last_note = (local.get("lastActionNote") or "").lower()
    new_rcs_actionable: list[dict] = []
    new_rcs_info: list[dict] = []
    for rc in palegis.get("rcs", []):
        rc_id = rc.get("rcNum") or rc.get("rollcallid")
        if not rc_id:
            continue
        if rc_id in known_rcs:
            continue
        # Look for the rc number quoted in the lastActionNote.
        if (re.search(rf"\brc\s*\.?\s*{rc_id}\b", last_note)
                or f"rcnum={rc_id}" in last_note
                or re.search(rf"roll\s*call\s*{rc_id}\b", last_note)):
            continue
        if rc.get("chamber") == "house" and rc.get("type") == "floor":
            new_rcs_actionable.append(rc)
        else:
            new_rcs_info.append(rc)
    if new_rcs_actionable:
        delta["changes"].append({
            "field": "rollCalls",
            "kind": "new_rolls_actionable",
            "rolls": new_rcs_actionable,
        })
    # Information-only items are attached separately and DON'T trigger
    # a delta on their own — they show up in the report only when
    # something else flagged the bill.
    delta["_info_rcs"] = new_rcs_info

    # Preserve _info_rcs even when no actionable delta — it's useful
    # context if the user wants to see what changed even when no
    # update is required.
    if not delta["changes"]:
        return {"id": billid, "label": delta["label"], "changes": [],
                "_info_rcs": delta.get("_info_rcs", [])}
    return delta


def compare_cosponsors(billid: str, local_cos: list[dict] | None,
                        palegis_pn: str | None) -> dict | None:
    """If the bill's PDF introducer list differs from the local cosponsor file,
    return a change record. We use last-name matching, which is approximate but
    catches most additions/removals."""
    if local_cos is None or not palegis_pn:
        return None
    try:
        pdf = fetch_bill_pdf(billid, palegis_pn)
    except Exception:
        return None
    intros = parse_introducers_from_pdf(pdf)
    if intros is None:
        return None
    palegis_names_upper = set(t.upper().replace(" ", "").replace(".", "") for t in intros)
    local_last_upper = set(c["name"].split()[-1].upper().replace("-", "") for c in local_cos)
    palegis_last_upper = set(re.sub(r"[^A-Z\-]", "", t) for t in palegis_names_upper)
    # Detect by last name only — close enough for the alert
    added = palegis_last_upper - local_last_upper
    removed = local_last_upper - palegis_last_upper
    if not added and not removed:
        return None
    return {"field": "cosponsors", "kind": "cosponsor_diff",
            "introducers_pdf": intros, "added_lastnames": sorted(added),
            "removed_lastnames": sorted(removed)}


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------
def render_md_report(scan: dict) -> str:
    lines: list[str] = []
    lines.append(f"# Bills scan — {scan['scan_date']}")
    lines.append("")
    lines.append(f"Checked **{scan['bills_checked']}** current-session bills. "
                 f"**{len(scan['deltas'])}** with palegis activity newer than the site record.")
    lines.append("")
    if not scan["deltas"]:
        lines.append("All tracked bills are current. Nothing to update.")
        return "\n".join(lines)
    lines.append("---")
    lines.append("")
    for d in scan["deltas"]:
        lines.append(f"## {d['id']} — {d['label']}")
        lines.append("")
        for ch in d["changes"]:
            if ch["kind"] == "pn_bump":
                lines.append(f"- **PN bump**: `{ch['from']}` → `{ch['to']}`")
            elif ch["kind"] == "date_change":
                lines.append(f"- **lastActionDate**: `{ch['from']}` → `{ch['to']}`")
                if ch.get("palegis_text"):
                    lines.append(f"  - palegis text: _{ch['palegis_text']}_")
            elif ch["kind"] == "new_rolls_actionable":
                lines.append(f"- **New House floor roll call(s)** ({len(ch['rolls'])}) — fetch + register:")
                for r in ch["rolls"]:
                    summary = (f"  - rc {r.get('rcNum', '?')} "
                               f"({r.get('chamber', '?')}/{r.get('type', '?')}): "
                               f"_{r['text']}_")
                    lines.append(summary)
            elif ch["kind"] == "cosponsor_diff":
                lines.append("- **Cosponsor list change** (introducer-list compare on latest PN):")
                if ch.get("added_lastnames"):
                    lines.append(f"  - added (in palegis PDF, not in our file): {ch['added_lastnames']}")
                if ch.get("removed_lastnames"):
                    lines.append(f"  - removed (in our file, not in palegis PDF): {ch['removed_lastnames']}")
        lines.append("")
        # Proposed updates: walking the user through what to write
        lines.append("### Proposed updates")
        lines.append("")
        local = d.get("local", {})
        for ch in d["changes"]:
            if ch["kind"] == "pn_bump":
                # propose new billTextUrl
                src = local.get("billTextUrl", "")
                if src:
                    new_url = re.sub(r"/PN\d+", f"/PN{ch['to']}", src)
                    lines.append(f"- Set `billTextUrl` to:\n  ```\n  {new_url}\n  ```")
            elif ch["kind"] == "date_change":
                lines.append(f'- Set `lastActionDate` to `"{ch["to"]}"`.')
                lines.append("- Rewrite `lastActionNote` to reflect the new action. Suggested template:")
                lines.append("  ```")
                lines.append(f"  [chamber] [action] {ch['palegis_text']}; printer's number bumped.")
                lines.append("  ```")
            elif ch["kind"] == "new_rolls_actionable":
                lines.append("- Fetch each via `fetch_rollcall.py`, generate vote TS file, wire into `mapItems.ts`. Suggested commands:")
                for r in ch["rolls"]:
                    lines.append(f"  - `uv run --project pipeline python pipeline/scripts/fetch_rollcall.py --session 2025 --chamber house --rc-num {r['rcNum']}`")
                lines.append("- Status field likely needs to advance (e.g. `passed_committee` → `passed_2nd_consideration` or `passed_chamber`).")
            elif ch["kind"] == "cosponsor_diff":
                fname = f"src/data/cosponsors/{d['id'].lower()}-cosponsors.ts"
                lines.append(f"- Update `{fname}` to match the latest PDF introducer list.")
                if ch.get("introducers_pdf"):
                    lines.append("  - Current palegis introducer list:")
                    lines.append(f"    ```")
                    lines.append(f"    {ch['introducers_pdf']}")
                    lines.append(f"    ```")
        # Informational RCs (committee + Senate floor) that don't trigger
        # their own delta but are worth knowing about in context.
        info_rcs = d.get("_info_rcs", [])
        if info_rcs:
            lines.append("### Informational only (not auto-flagged)")
            lines.append("")
            for r in info_rcs:
                tag = f"{r.get('chamber', '?')}/{r.get('type', '?')}"
                rc_id = r.get("rcNum") or r.get("rollcallid", "?")
                lines.append(f"- rc {rc_id} ({tag}): _{r['text']}_")
            lines.append("")
        lines.append("---")
        lines.append("")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Scanning {ALL_BILLS_TS} ...")
    local_bills = parse_local_bills()
    print(f"  {len(local_bills)} current-session bills tracked")

    deltas: list[dict] = []
    for bid in sorted(local_bills.keys()):
        local = local_bills[bid]
        try:
            html = fetch_bill_info(bid)
            palegis = parse_palegis_info(html)
        except Exception as e:
            print(f"  {bid}: ERROR fetching info — {e}")
            continue
        result = compare_bill(bid, local, palegis)
        # Cosponsor diff is computed lazily only when there's already an
        # other delta OR when explicitly requested. To keep the v1 scan
        # cheap, we only run it when there's already a PN bump or
        # new-roll-call delta — that's the most common case where
        # cosponsors might have changed.
        if result["changes"]:
            local_cos = parse_local_cosponsors(bid)
            cosp = compare_cosponsors(bid, local_cos, palegis.get("latestPN"))
            if cosp:
                result["changes"].append(cosp)
            result["local"] = local
            result["palegis"] = {k: v for k, v in palegis.items() if k != "rcs"}
            result["palegis_rcs_count"] = len(palegis.get("rcs", []))
            deltas.append(result)
            flag = "🔴"
        else:
            flag = "  "
        print(f"  {flag} {bid}  local_pn={local.get('localPN','?')}  "
              f"palegis_pn={palegis.get('latestPN','?')}  "
              f"local_date={local.get('lastActionDate','?')}  "
              f"palegis_date={palegis.get('last_action_date','?')}")
        time.sleep(0.25)

    scan = {
        "scan_date": datetime.now().isoformat(timespec="seconds"),
        "bills_checked": len(local_bills),
        "deltas": deltas,
    }

    (SCAN_OUT_DIR / "summary.json").write_text(json.dumps(scan, indent=2, default=str))
    (SCAN_OUT_DIR / "report.md").write_text(render_md_report(scan))

    print()
    print(f"Found {len(deltas)} bills with palegis activity newer than site record.")
    print(f"Report: {SCAN_OUT_DIR / 'report.md'}")
    print(f"Data:   {SCAN_OUT_DIR / 'summary.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
