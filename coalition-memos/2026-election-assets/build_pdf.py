"""Render memo.html to the branded BPN PDF with WeasyPrint.

WeasyPrint embeds images as plain DeviceRGB (no ICC color-profile wrapper),
which renders in lightweight/inline PDF viewers that choke on the
ICC-tagged images a headless-Chromium print produces. Brand fonts + logos
are staged from the bpn-social-graphics skill into a temp build dir next to
memo.html, then rendered.

Run with a Python that has WeasyPrint, e.g.:
    /opt/homebrew/bin/python3.14 coalition-memos/2026-election-assets/build_pdf.py

Prereqs:
  - Map PNGs already rendered (see render_flip_maps.py)
  - BPN skill present at ~/.claude/skills/bpn-social-graphics (fonts + logos)
Output: coalition-memos/BPN-PA-2026-election-housing-impact.pdf
"""
import shutil
import tempfile
from pathlib import Path
from weasyprint import HTML

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
        HTML(filename=str(bd / "memo.html"), base_url=str(bd) + "/").write_pdf(str(OUT_PDF))
    print("wrote", OUT_PDF)


if __name__ == "__main__":
    main()
