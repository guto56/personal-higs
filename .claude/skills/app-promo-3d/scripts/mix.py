"""Mixagem: música + SFX da lista exportada pela composição (window.__sfx → .build/cues.json).

uso: run.sh mix.py <projeto> [--music assets/audio/music.mp3] [--music-gain 0.9] [--duration 30]
Saída: <projeto>/.build/mix.mp3 (48 kHz, 256 kbps). Sem música, gera só os efeitos.
Os SFX ficam em <projeto>/assets/sfx/<nome>.mp3 (Pixabay, uso livre).
"""
import argparse, json, os, subprocess, sys
import numpy as np

SR = 48000


def dec(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("--music", default=None); ap.add_argument("--music-gain", type=float, default=0.9)
    ap.add_argument("--duration", type=float, default=None)
    a = ap.parse_args()
    pj = os.path.abspath(a.project)
    cues_p = os.path.join(pj, ".build", "cues.json")
    if not os.path.exists(cues_p):
        sys.exit("rode stills.py ou capture.py antes (eles gravam .build/cues.json a partir de window.__sfx)")
    cues = json.load(open(cues_p))
    cap = os.path.join(pj, ".build", "capture.json")
    dur = a.duration or (json.load(open(cap))["duration"] if os.path.exists(cap) else max([c["t"] for c in cues] + [10]) + 3)
    N = int(dur * SR)
    music = a.music or next((os.path.join(pj, "assets", "audio", f) for f in ("music.mp3", "music.wav") if os.path.exists(os.path.join(pj, "assets", "audio", f))), None)
    out = np.zeros((N, 2))
    if music:
        m = dec(music)[:N]; out[:len(m)] += a.music_gain * m
    cache = {}
    for c in cues:
        name = c["sfx"]
        if name not in cache:
            p = os.path.join(pj, "assets", "sfx", name + ".mp3")
            if not os.path.exists(p):
                print("SFX ausente:", p); cache[name] = None; continue
            cache[name] = dec(p)
        s = cache[name]
        if s is None:
            continue
        if c.get("rate", 1) != 1:
            idx = np.arange(0, len(s) - 1, c["rate"]); s = np.stack([np.interp(idx, np.arange(len(s)), s[:, k]) for k in range(2)], 1)
        if c.get("dur"):
            L = min(len(s), int(c["dur"] * SR)); fade = np.minimum(1, (L - np.arange(L)) / (0.03 * SR))[:, None]; s = s[:L] * fade
        i = int(c["t"] * SR)
        if i >= N:
            continue
        s = s[:N - i]; pan = c.get("pan", 0); g = c.get("gain", 0.5)
        out[i:i + len(s)] += s * np.array([g * (1 - max(0, pan)), g * (1 + min(0, pan))])
    out = np.tanh(out * 1.1) / np.tanh(1.1)
    out /= max(1e-9, np.abs(out).max()) / 0.95
    dst = os.path.join(pj, ".build", "mix.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "libmp3lame", "-b:a", "256k", dst],
                   input=(out * 32767).astype(np.int16).tobytes(), check=True)
    # cópia para o player do HyperFrames (<audio src="assets/audio/mix.mp3">)
    os.makedirs(os.path.join(pj, "assets", "audio"), exist_ok=True)
    subprocess.run(["cp", dst, os.path.join(pj, "assets", "audio", "mix.mp3")])
    print(dst, f"({len(cues)} efeitos, música: {os.path.basename(music) if music else 'nenhuma'})")


main()
