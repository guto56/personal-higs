#!/usr/bin/env bash
# Roda um script da skill com um Python que tenha playwright + numpy + pillow (cria o venv na 1ª vez).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
VENV="${APP_PROMO_VENV:-$HOME/.cache/app-promo-3d/venv}"
if ! "$VENV/bin/python" -c "import playwright, numpy, PIL" 2>/dev/null; then
  echo "[app-promo-3d] criando ambiente Python em $VENV ..." >&2
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q playwright numpy pillow >&2
fi
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
SCRIPT="$1"; shift
exec "$VENV/bin/python" "$HERE/$SCRIPT" "$@"
