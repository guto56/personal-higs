"""Analisa a música: BPM, grade de batidas, candidatos a drop e corte sugerido.

uso:
  run.sh analyze_music.py faixa.mp3                     # relatório
  run.sh analyze_music.py faixa.mp3 --drop-at 10 --len 30 --out <projeto>/assets/audio/music.mp3
      → corta a faixa para o drop mais forte cair em --drop-at segundos, com fade in/out, e grava .json ao lado
  --drop <s> força o drop (segundos na faixa original) quando a escolha automática não for a desejada.
"""
import argparse, json, subprocess, sys
import numpy as np

SR = 22050


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio"); ap.add_argument("--drop-at", type=float, default=10.0); ap.add_argument("--len", type=float, default=30.0)
    ap.add_argument("--out", default=None); ap.add_argument("--drop", type=float, default=None)
    a = ap.parse_args()
    x = decode(a.audio)
    if len(x) < SR * 5:
        sys.exit("áudio curto demais ou ilegível")
    hop, win = 512, 2048
    n = 1 + (len(x) - win) // hop
    frames = np.lib.stride_tricks.as_strided(x, (n, win), (x.strides[0] * hop, x.strides[0]))
    mag = np.abs(np.fft.rfft(frames * np.hanning(win), axis=1))
    fr = hop / SR
    flux = np.maximum(0, np.diff(np.log1p(mag), axis=0)).sum(1); flux = np.r_[0, flux]
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    # BPM por autocorrelação do envelope de ataques
    ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    lags = np.arange(len(ac)) * fr
    ok = (lags > 60 / 180) & (lags < 60 / 70)
    lag = lags[ok][np.argmax(ac[ok])]
    bpm = 60 / lag
    # refinamento: pico da autocorrelação em 8 batidas (resolução 8x melhor) com interpolação parabólica
    L = int(round(8 * lag / fr)); w = max(3, int(L * 0.04))
    seg_ = ac[L - w:L + w + 1]; j = int(np.argmax(seg_)); c = L - w + j
    if 0 < j < len(seg_) - 1:
        y0, y1, y2 = seg_[j - 1], seg_[j], seg_[j + 1]; c += 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2 + 1e-12)
    bpm_f = 60 / (c * fr / 8)
    beat = 60 / bpm_f
    per = beat / fr
    phases = np.linspace(0, per, 48, endpoint=False)
    sc = [flux[(np.arange(0, len(flux) - per, per) + p).astype(int)].sum() for p in phases]
    phase = phases[int(np.argmax(sc))] * fr
    # energia de graves (< 150 Hz) — o drop é a maior subida depois de um vale
    bins = np.fft.rfftfreq(win, 1 / SR) < 150
    bass = mag[:, bins].sum(1)
    k = int(0.05 / fr) or 1
    bass_s = np.convolve(bass, np.ones(k) / k, "same")
    pre, post = int(2.0 / fr), int(1.0 / fr)
    med = np.median(bass_s)
    cands = []
    for i in range(pre, len(bass_s) - post):
        before, after = bass_s[i - pre:i].mean(), bass_s[i:i + post].mean()
        # drop = entrada forte de graves vinda de um trecho baixo, mas não de silêncio (fim/início da faixa)
        if after < 1.2 * med or before < 0.08 * med:
            continue
        cands.append(((after - before) / med, i * fr))
    cands.sort(reverse=True)
    drops = []
    for r, t in cands:
        if all(abs(t - d) > 4 for _, d in drops):
            # encaixa na batida mais próxima
            tb = phase + round((t - phase) / beat) * beat
            drops.append((round(float(r), 2), round(float(tb), 3)))
        if len(drops) == 5:
            break
    total = len(x) / SR
    viaveis = [t for _, t in drops if t - a.drop_at >= 0 and t - a.drop_at + a.len <= total]
    drop = a.drop if a.drop is not None else (viaveis[0] if viaveis else drops[0][1])
    start = max(0.0, drop - a.drop_at)
    rep = {"bpm": round(bpm_f, 2), "beat": round(beat, 4), "bar": round(beat * 4, 4), "phase": round(phase, 3),
           "drops_candidatos": [{"t": t, "forca": r} for r, t in drops], "drop_escolhido": drop,
           "corte_inicio": round(start, 3), "drop_no_corte": round(drop - start, 3),
           "compassos_no_corte": [round(drop - start + i * beat * 4, 3) for i in range(-6, 12) if 0 <= drop - start + i * beat * 4 <= a.len]}
    print(json.dumps(rep, ensure_ascii=False, indent=1))
    if a.out:
        fo = a.len - 1.4
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{a.len:.3f}", "-i", a.audio,
                        "-af", f"afade=t=in:d=0.4,afade=t=out:st={fo:.3f}:d=1.4", "-ar", "48000", "-b:a", "256k", a.out], check=True)
        json.dump(rep, open(a.out.rsplit(".", 1)[0] + ".json", "w"), ensure_ascii=False, indent=1)
        print("corte gravado em", a.out)


main()
