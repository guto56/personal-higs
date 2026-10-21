"""Quadros de revisão: renderiza instantes escolhidos e monta uma folha com rótulos.

uso: run.sh stills.py <projeto> 0.5,2.8,5.2 [--out folha.jpg] [--cols 2]
Os PNG/JPG individuais ficam em <projeto>/.build/stills/. Também grava .build/cues.json (window.__sfx).
"""
import argparse, asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _common import serve, open_page, grab
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("times")
    ap.add_argument("--out", default=None); ap.add_argument("--cols", type=int, default=2); ap.add_argument("--w", type=int, default=800)
    a = ap.parse_args()
    times = [float(x) for x in a.times.split(",") if x.strip()]
    outdir = os.path.join(a.project, ".build", "stills"); os.makedirs(outdir, exist_ok=True)
    url = serve(a.project)
    async with async_playwright() as pw:
        browser, page, cdp, logs = await open_page(pw, url)
        sfx = await page.evaluate("window.__sfx || []")
        json.dump(sfx, open(os.path.join(a.project, ".build", "cues.json"), "w"), ensure_ascii=False, indent=0)
        files = []
        for t in times:
            p = os.path.join(outdir, f"t{t:06.2f}.jpg"); await grab(page, cdp, t, p); files.append((t, p))
        await browser.close()
    if logs:
        print("avisos do navegador:", *logs[:10], sep="\n  ")
    w = a.w; hgt = w * 9 // 16; cols = a.cols; rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * hgt), "#111"); d = ImageDraw.Draw(sheet)
    for i, (t, p) in enumerate(files):
        im = Image.open(p).convert("RGB").resize((w, hgt)); x, y = (i % cols) * w, (i // cols) * hgt
        sheet.paste(im, (x, y)); d.rectangle([x, y, x + 74, y + 20], fill="#000"); d.text((x + 6, y + 4), f"{t:.2f}s", fill="#ff0")
    out = a.out or os.path.join(a.project, ".build", "stills", "sheet.jpg")
    sheet.save(out, quality=88); print(out)


asyncio.run(main())
