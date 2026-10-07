#!/usr/bin/env bash
# Install/enable systemd service so the listener starts on boot.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
UNIT_SRC="$ROOT/listener.service"
UNIT_DST="/etc/systemd/system/radio-listener.service"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Run setup_pi.sh first."
  exit 1
fi

TMP="$(mktemp)"
sed "s|/opt/radio-listener/device|$ROOT|g" "$UNIT_SRC" > "$TMP"
sudo cp "$TMP" "$UNIT_DST"
rm -f "$TMP"

sudo systemctl daemon-reload
sudo systemctl enable radio-listener.service
sudo systemctl restart radio-listener.service
sudo systemctl --no-pager --full status radio-listener.service || true

echo
echo "Service installed. Useful commands:"
echo "  sudo systemctl status radio-listener"
echo "  sudo journalctl -u radio-listener -f"
echo "  sudo systemctl stop radio-listener"
