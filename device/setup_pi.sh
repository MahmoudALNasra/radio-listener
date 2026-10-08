#!/usr/bin/env bash
# Install the radio keyword listener on Raspberry Pi OS (Bookworm / Pi 3B+).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Installing system packages"
sudo apt-get update
sudo apt-get install -y \
  python3-venv \
  python3-pip \
  python3-dev \
  portaudio19-dev \
  libportaudio2 \
  git \
  patchelf

echo "==> Creating Python venv"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Newer Pi OS / kernels reject libs that request an executable stack.
# Clear that flag on Vosk's native library (fixes: cannot enable executable stack).
echo "==> Patching libvosk.so (clear execstack bit)"
fixchelf_vosk() {
  local so="$1"
  if command -v patchelf >/dev/null 2>&1; then
    patchelf --clear-execstack "$so" 2>/dev/null \
      || sudo patchelf --clear-execstack "$so" 2>/dev/null \
      || true
  elif command -v execstack >/dev/null 2>&1; then
    execstack -c "$so" 2>/dev/null || sudo execstack -c "$so" 2>/dev/null || true
  else
    echo "    WARN: install patchelf: sudo apt install -y patchelf"
    return 1
  fi
  echo "    patched $so"
}
while IFS= read -r so; do
  patch_vosk "$so"
done < <(find "$ROOT/.venv" -name 'libvosk.so' 2>/dev/null)

if [[ ! -f config.json ]]; then
  echo "==> Creating config.json from Pi example"
  cp config.pi.example.json config.json
  echo "Edit config.json and set supabase_anon_key before enabling cloud sync."
fi

echo "==> Downloading Vosk speech model (one-time)"
python download_model.py

echo
echo "Done."
echo "Next:"
echo "  1. Plug in the USB mic"
echo "  2. source $ROOT/.venv/bin/activate"
echo "  3. python list_audio_devices.py"
echo "  4. Edit config.json (input_device / supabase_anon_key)"
echo "  5. python listener.py"
echo
echo "Optional auto-start:"
echo "  sudo $ROOT/install_service.sh"
