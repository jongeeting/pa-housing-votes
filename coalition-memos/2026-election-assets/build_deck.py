"""Render deck.html to the branded BPN slide deck PDF (16:9) with WeasyPrint.

Run with a Python that has WeasyPrint:
    /opt/homebrew/bin/python3.14 coalition-memos/2026-election-assets/build_deck.py

Prereqs: map PNGs rendered (render_flip_maps.py); BPN skill present for
fonts + logos. Output: coalition-memos/BPN-PA-2026-built-environment-deck.pdf
"""
import shutil
import tempfile
from pathlib import Path
from weasyprint import HTML

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SKILL = Path.home() / ".claude" / "skills" / "bpn-social-graphics" / "assets"
OUT_PDF = REPO / "coalition-memos" / "BPN-PA-2026-built-environment-deck.pdf"


def main():
    with tempfile.TemporaryDirectory() as td:
        bd = Path(td)
        (bd / "fonts").mkdir()
        shutil.copy(SKILL / "fonts" / "Brother1816-Bold.otf", bd / "fonts")
        shutil.copy(SKILL / "fonts" / "PlusJakartaSans-Variable-latin.woff2", bd / "fonts")
        shutil.copy(SKILL / "bpn-logo-white.svg", bd)
        shutil.copy(SKILL / "bpn-logo-green.svg", bd)
        shutil.copy(HERE / "deck.html", bd / "deck.html")
        shutil.copy(HERE / "map-house-flips.png", bd)
        shutil.copy(HERE / "map-senate-flips.png", bd)
        HTML(filename=str(bd / "deck.html"), base_url=str(bd) + "/").write_pdf(str(OUT_PDF))
    print("wrote", OUT_PDF)


if __name__ == "__main__":
    main()
