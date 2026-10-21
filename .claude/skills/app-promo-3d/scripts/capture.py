"""Captura dos quadros em paralelo, retomável e resistente a travamentos.

Substitui `hyperframes render`, que trava com WebGL por software em vídeos longos (perda de contexto no Chrome).

Grade de tempo: índice i em 240 qps (t = i/240). Modos:
  mb30   30 qps com motion blur real: 4 subquadros por quadro dentro de 1/60 s (obturador de 180°) → i = 8n+0..3
  p60    60 qps sem blur → i = 4m
  draft  30 qps sem blur, para revisar rápido → i = 8n
  (padrão: mb30+p60, que reaproveita os subquadros: i = 8n+0..4)

uso: run.sh capture.py <projeto> [--mode mb30+p60] [--workers 4] [--range 0,30] [--batch 30]
Quadros em <projeto>/.build/frames/f<i>.jpg. Rodar de novo continua de onde parou.
"""
import argparse, asyncio, json, multiprocessing as mp, os, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from _common import serve, open_page, grab

GRID = 240


def plan(mode, dur, rng):
    t0, t1 = rng if rng else (0, dur)
    idx = set()
    modes = mode.split("+")
    n30 = int(round(dur * 30))
    for n in range(n30):
        base = 8 * n
        if not (t0 <= base / GRID < t1):
            continue
        if "mb30" in modes:
            idx.update(base + k for k in range(4))
        if "draft" in modes:
            idx.add(base)
        if "p60" in modes:
            idx.update([base, base + 4])
    return sorted(i for i in idx if i / GRID < dur)


def worker(args):
    project, frames, batch, wid = args
    import asyncio as aio
    from playwright.async_api import async_playwright
    outdir = os.path.join(project, ".build", "frames")
    fails = {}

    async def session(todo, url):
        async with async_playwright() as pw:
            browser, page, cdp, logs = await open_page(pw, url)
            n = 0
            try:
                for i in todo:
                    p = os.path.join(outdir, f"f{i:06d}.jpg")
                    if os.path.exists(p):
                        continue
                    if n >= batch:
                        break   # reinicia o navegador a cada lote: evita acúmulo de memória gráfica
                    try:
                        await aio.wait_for(grab(page, cdp, i / GRID, p), 90)
                        n += 1
                    except Exception as e:
                        fails[i] = fails.get(i, 0) + 1
                        print(f"[w{wid}] falha no quadro {i} ({i / GRID:.3f}s): {str(e)[:90]}", flush=True)
                        break
            finally:
                await browser.close()

    async def run():
        url = serve(project)
        todo = [i for i in frames if not os.path.exists(os.path.join(outdir, f"f{i:06d}.jpg"))]
        while todo:
            try:
                await session(todo, url)
            except Exception as e:
                print(f"[w{wid}] reiniciando: {str(e)[:120]}", flush=True)
            todo = [i for i in todo if not os.path.exists(os.path.join(outdir, f"f{i:06d}.jpg")) and fails.get(i, 0) < 3]
        return [i for i, c in fails.items() if c >= 3]

    return aio.run(run())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("--mode", default="mb30+p60")
    ap.add_argument("--workers", type=int, default=max(1, min(4, os.cpu_count() or 2)))
    ap.add_argument("--range", default=None, help="início,fim em segundos")
    ap.add_argument("--batch", type=int, default=30)
    ap.add_argument("--duration", type=float, default=None)
    a = ap.parse_args()
    project = os.path.abspath(a.project)
    os.makedirs(os.path.join(project, ".build", "frames"), exist_ok=True)
    dur = a.duration
    if dur is None:
        # lê a duração e os SFX da própria composição
        from playwright.async_api import async_playwright
        async def probe():
            async with async_playwright() as pw:
                b, page, cdp, logs = await open_page(pw, serve(project))
                d = await page.evaluate("window.__duration || null")
                sfx = await page.evaluate("window.__sfx || []")
                await b.close(); return d, sfx
        dur, sfx = asyncio.run(probe())
        json.dump(sfx, open(os.path.join(project, ".build", "cues.json"), "w"), ensure_ascii=False, indent=0)
        if not dur:
            sys.exit("defina window.__duration na composição ou passe --duration")
    rng = tuple(float(x) for x in a.range.split(",")) if a.range else None
    idx = plan(a.mode, dur, rng)
    json.dump({"mode": a.mode, "duration": dur, "grid": GRID}, open(os.path.join(project, ".build", "capture.json"), "w"))
    done0 = sum(os.path.exists(os.path.join(project, ".build", "frames", f"f{i:06d}.jpg")) for i in idx)
    print(f"{len(idx)} quadros no plano ({a.mode}, {dur}s), {done0} já prontos, {a.workers} processos", flush=True)
    chunks = [(project, idx[w::a.workers], a.batch, w) for w in range(a.workers)]
    t0 = time.time()
    with mp.Pool(a.workers) as pool:
        res = pool.map_async(worker, chunks)
        while not res.ready():
            res.wait(30)
            done = sum(os.path.exists(os.path.join(project, ".build", "frames", f"f{i:06d}.jpg")) for i in idx)
            el = time.time() - t0; rate = (done - done0) / el if el > 0 else 0
            eta = (len(idx) - done) / rate / 60 if rate > 0 else float("nan")
            print(f"  {done}/{len(idx)}  {rate:.2f} q/s  faltam ~{eta:.0f} min", flush=True)
        bad = sorted(sum(res.get(), []))
    if bad:
        print("quadros que falharam 3x:", bad[:20], "… veja references/pitfalls.md"); sys.exit(1)
    print("captura completa")


if __name__ == "__main__":
    main()
