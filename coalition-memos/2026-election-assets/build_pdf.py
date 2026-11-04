"""Render memo.html to the branded BPN PDF.

Stages the BPN brand fonts + logos (from the bpn-social-graphics skill)
and the map PNGs into a temp build dir next to memo.html, then prints to
PDF via headless Chromium.

Run with a Python that has Playwright (Chromium installed), e.g.:
    /opt/homebrew/bin/python3.14 coalition-memos/2026-election-assets/build_pdf.py

Prereqs:
  - Map PNGs already rendered (see render_flip_maps.py)
  - BPN skill present at ~/.claude/skills/bpn-social-graphics (fonts + logos)
Output: coalition-memos/BPN-PA-2026-election-housing-impact.pdf
"""
import shutil
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SKILL = Path.home() / ".claude" / "skills" / "bpn-social-graphics" / "assets"
OUT_PDF = REPO / "coalition-memos" / "BPN-PA-2026-election-housing-impact.pdf"


def main():
    with tempfile.TemporaryDirectory() as td:
        bd = Path(td)
        (bd / "fonts").mkdir()
        shutil.copy(SKILL / "fonts" / "Brother1816-Bold.otf", bd / "fonts")
        shutil.copy(SKILL / "fonts" / "PlusJakartaSans-Variable-latin.woff2", bd / "fonts")
        shutil.copy(SKILL / "bpn-logo-white.svg", bd)
        shutil.copy(SKILL / "bpn-logo-green.svg", bd)
        shutil.copy(HERE / "memo.html", bd / "memo.html")
        shutil.copy(HERE / "map-house-flips.png", bd)
        shutil.copy(HERE / "map-senate-flips.png", bd)
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page()
            pg.goto((bd / "memo.html").as_uri(), wait_until="networkidle")
            pg.evaluate("async () => { await document.fonts.ready; }")
            pg.pdf(path=str(OUT_PDF), width="8.5in", height="11in", print_background=True,
                   margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            b.close()
    print("wrote", OUT_PDF)


if __name__ == "__main__":
    main()
