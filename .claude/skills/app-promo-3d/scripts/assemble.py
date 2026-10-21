"""Monta os vídeos finais a partir de .build/frames (grade de 240 qps) + .build/mix.mp3.

  <nome>_1080p30.mp4   30 qps com motion blur (média de 4 subquadros em luz linear = obturador de 180°)
  <nome>_1080p60.mp4   60 qps
  <nome>_1080p30-draft.mp4  (modo draft)
  <nome>_contact-sheet.jpg  1 quadro por segundo

uso: run.sh assemble.py <projeto> --name meu-comercial [--audio caminho.mp3]
"""
import argparse, json, os, subprocess, sys
import numpy as np
from PIL import Image

GRID = 240


def frame(project, i):
    return os.path.join(project, ".build", "frames", f"f{i:06d}.jpg")


def encode(out, frames_iter, fps, audio, crf):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(fps), "-i", "-"]
    if audio and os.path.exists(audio):
        cmd += ["-i", audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "256k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for arr in frames_iter:
        p.stdin.write(arr.tobytes())
    p.stdin.close(); p.wait()
    if p.returncode:
        sys.exit("ffmpeg falhou em " + out)
    print(out)


def load(path):
    return np.asarray(Image.open(path).convert("RGB"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("--name", required=True); ap.add_argument("--audio", default=None)
    a = ap.parse_args()
    project = os.path.abspath(a.project)
    info = json.load(open(os.path.join(project, ".build", "capture.json")))
    dur, modes = info["duration"], info["mode"].split("+")
    audio = a.audio or os.path.join(project, ".build", "mix.mp3")
    out = os.path.join(project, "renders"); os.makedirs(out, exist_ok=True)
    n30 = int(round(dur * 30))
    lut = (np.arange(256) / 255.0) ** 2.2   # sRGB→linear aproximado: a média em luz linear evita rastros escuros

    def missing(idx):
        m = [i for i in idx if not os.path.exists(frame(project, i))]
        if m:
            sys.exit(f"faltam {len(m)} quadros (ex.: {m[:5]}). Rode capture.py de novo.")

    if "mb30" in modes:
        missing([8 * n + k for n in range(n30) for k in range(4)])
        def mb():
            for n in range(n30):
                acc = sum(lut[load(frame(project, 8 * n + k))] for k in range(4)) / 4
                yield (np.clip(acc ** (1 / 2.2), 0, 1) * 255 + 0.5).astype(np.uint8)
        encode(os.path.join(out, f"{a.name}_1080p30.mp4"), mb(), 30, audio, 17)
    if "p60" in modes:
        idx = [4 * m for m in range(n30 * 2)]; missing(idx)
        encode(os.path.join(out, f"{a.name}_1080p60.mp4"), (load(frame(project, i)) for i in idx), 60, audio, 16)
    if "draft" in modes and "mb30" not in modes:
        idx = [8 * n for n in range(n30)]; missing(idx)
        encode(os.path.join(out, f"{a.name}_1080p30-draft.mp4"), (load(frame(project, i)) for i in idx), 30, audio, 20)
    # folha de quadros: 1 por segundo
    secs = list(range(int(dur)))
    cols = 5; rows = (len(secs) + cols - 1) // cols; w, h = 480, 270
    sheet = Image.new("RGB", (cols * w, rows * h), "#000")
    for k, s in enumerate(secs):
        i = s * GRID if os.path.exists(frame(project, s * GRID)) else 8 * s * 30
        if os.path.exists(frame(project, i)):
            sheet.paste(Image.open(frame(project, i)).convert("RGB").resize((w, h)), ((k % cols) * w, (k // cols) * h))
    p = os.path.join(out, f"{a.name}_contact-sheet.jpg"); sheet.save(p, quality=88); print(p)


main()
