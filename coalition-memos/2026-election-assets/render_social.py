"""Render the BPN election social cards to 1080x1080 PNGs (Instagram square).

Playwright screenshots each .card element at exact size — same approach as
the bpn-social-graphics skill's renderer. Brand fonts + logos staged from
that skill. Run:
    /opt/homebrew/bin/python3.14 coalition-memos/2026-election-assets/render_social.py

Output PNGs land next to this script (social-*.png).
"""
import shutil
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SKILL = Path.home() / ".claude" / "skills" / "bpn-social-graphics" / "assets"
CARDS = {"c1": "social-senate-flip.png", "c2": "social-anti-transit.png",
         "c3": "social-built-environment.png"}


def main():
    with tempfile.TemporaryDirectory() as td:
        bd = Path(td)
        (bd / "fonts").mkdir()
        shutil.copy(SKILL / "fonts" / "Brother1816-Bold.otf", bd / "fonts")
        shutil.copy(SKILL / "fonts" / "PlusJakartaSans-Variable-latin.woff2", bd / "fonts")
        shutil.copy(SKILL / "bpn-logo-white.svg", bd)
        shutil.copy(SKILL / "bpn-logo-green.svg", bd)
        shutil.copy(HERE / "social-cards.html", bd / "social-cards.html")
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={"width": 1080, "height": 1080},
                            device_scale_factor=2)
            pg.goto((bd / "social-cards.html").as_uri(), wait_until="networkidle")
            pg.evaluate("async () => { await document.fonts.ready; }")
            for cid, out in CARDS.items():
                el = pg.query_selector(f"#{cid}")
                el.screenshot(path=str(HERE / out))
                print("wrote", HERE / out)
            b.close()


if __name__ == "__main__":
    main()
