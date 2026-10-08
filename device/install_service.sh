#!/usr/bin/env bash
# Install/enable systemd services: git update on boot, then listener.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Run setup_pi.sh first."
  exit 1
fi

chmod +x "$ROOT/update_from_git.sh" "$ROOT/setup_pi.sh" "$ROOT/install_service.sh"

install_unit() {
  local src="$1"
  local dst="$2"
  local tmp
  tmp="$(mktemp)"
  sed -e "s|/opt/radio-listener/device|$ROOT|g" \
      -e "s|/opt/radio-listener|$REPO|g" \
      "$src" > "$tmp"
  sudo cp "$tmp" "$dst"
  rm -f "$tmp"
}

install_unit "$ROOT/radio-listener-update.service" \
  /etc/systemd/system/radio-listener-update.service
install_unit "$ROOT/listener.service" \
  /etc/systemd/system/radio-listener.service

sudo systemctl daemon-reload
sudo systemctl enable radio-listener-update.service radio-listener.service
sudo systemctl start radio-listener-update.service || true
sudo systemctl restart radio-listener.service
sudo systemctl --no-pager --full status radio-listener-update.service || true
sudo systemctl --no-pager --full status radio-listener.service || true

echo
echo "Services installed:"
echo "  radio-listener-update  — git pull on every boot"
echo "  radio-listener         — keyword listener"
echo
echo "Useful commands:"
echo "  sudo journalctl -u radio-listener-update -u radio-listener -f"
echo "  sudo systemctl restart radio-listener"
echo "  sudo systemctl stop radio-listener"
echo
echo "Private GitHub repo needs a deploy key or saved credentials on the Pi"
echo "(see docs/setup-raspberry-pi.md — Auto-update from GitHub)."
