"""Utilitários compartilhados: achar o Chrome, servir o projeto por HTTP e abrir a página pronta para render(t)."""
import glob, os, socket, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

# --disable-gpu-compositing: o print sai 2–10x mais rápido com WebGL por software (medido: 2,4 s → 0,2–1 s por quadro).
CHROME_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-compositing", "--hide-scrollbars"]


def find_chrome():
    env = os.environ.get("APP_PROMO_CHROME")
    if env and os.path.exists(env):
        return env
    pats = [os.path.expanduser("~/.cache/hyperframes/chrome/**/chrome-headless-shell"),
            "/opt/pw-browsers/chromium_headless_shell-*/**/chrome-headless-shell",
            os.path.expanduser("~/.cache/ms-playwright/chromium_headless_shell-*/**/chrome-headless-shell"),
            "/opt/pw-browsers/chromium-*/chrome-linux/chrome"]
    for p in pats:
        hits = sorted(glob.glob(p, recursive=True), reverse=True)
        hits = [h for h in hits if os.path.isfile(h) and os.access(h, os.X_OK)]
        if hits:
            return hits[0]
    return None  # playwright usa o navegador padrão


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(project_dir):
    """Sobe um servidor HTTP do projeto numa porta livre (thread daemon). Retorna a URL base."""
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    httpd = ThreadingHTTPServer(("127.0.0.1", port), functools.partial(_Quiet, directory=os.path.abspath(project_dir)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port}/index.html"


async def open_page(pw, url, page_name="index.html"):
    """Abre a composição e espera fontes, imagens, modelo 3D e window.__render."""
    exe = find_chrome()
    kw = {"args": CHROME_ARGS}
    if exe:
        kw["executable_path"] = exe
    browser = await pw.chromium.launch(**kw)
    page = await browser.new_page(viewport={"width": 1920, "height": 1080})
    logs = []
    page.on("console", lambda m: logs.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: logs.append("ERRO: " + str(e)))
    await page.goto(url)
    try:
        await page.wait_for_function("!!window.__render && Array.from(document.images).every(i => i.complete)", polling=500, timeout=120000)
    except Exception:
        raise RuntimeError("a página não ficou pronta (window.__render ausente). Logs: " + " | ".join(logs[:8]))
    await page.wait_for_timeout(400)
    cdp = await page.context.new_cdp_session(page)
    return browser, page, cdp, logs


async def grab(page, cdp, t, path, quality=95):
    """Renderiza o instante t e salva um JPEG. Lança erro se o WebGL perdeu o contexto."""
    import base64
    lost = await page.evaluate(f"(window.__render({t}), window.__lost || false)")
    if lost:
        raise RuntimeError("contexto WebGL perdido")
    r = await cdp.send("Page.captureScreenshot", {"format": "jpeg", "quality": quality, "optimizeForSpeed": True})
    tmp = path + ".tmp"
    with open(tmp, "wb") as f:
        f.write(base64.b64decode(r["data"]))
    os.replace(tmp, path)
