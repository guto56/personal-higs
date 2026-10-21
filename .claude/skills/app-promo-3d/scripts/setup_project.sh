#!/usr/bin/env bash
# Cria um projeto novo a partir do template (ou do exemplo completo do Spotify).
# uso: setup_project.sh <pasta-do-projeto> [--example spotify]
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DST="$1"; [ -z "$DST" ] && { echo "uso: setup_project.sh <pasta> [--example spotify]"; exit 1; }
if [ -e "$DST/index.html" ]; then echo "já existe $DST/index.html — não sobrescrevo"; exit 1; fi
mkdir -p "$DST"
cp -r "$SKILL/template/." "$DST/"
mkdir -p "$DST/assets/audio" "$DST/assets/brand" "$DST/refs" "$DST/.build" "$DST/renders"
if [ "$2" = "--example" ] && [ "$3" = "spotify" ]; then
  cp -r "$SKILL/examples/spotify/." "$DST/"
  echo "exemplo Spotify copiado (a música não vem junto: veja $DST/BRIEF.md, seção Assets)"
fi
cat > "$DST/hyperframes.json" <<'J'
{ "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": { "blocks": "compositions", "components": "compositions/components", "assets": "assets" } }
J
cat > "$DST/.gitignore" <<'J'
.build/
renders/
J
# confere ferramentas
command -v ffmpeg >/dev/null || echo "AVISO: ffmpeg não encontrado"
python3 - <<P
import sys; sys.path.insert(0, "$SKILL/scripts")
from _common import find_chrome
c = find_chrome(); print("Chrome:", c or "padrão do playwright (rode: npx playwright install chromium-headless-shell)")
P
echo "projeto pronto em $DST"
