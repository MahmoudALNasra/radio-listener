# Raspberry Pi 3B+ setup (cabin mic listener)

Goal: run the keyword listener on the Pi, capture USB mic audio, save clips, and optionally sync to Supabase.

## What you need

- Raspberry Pi 3B+ with Raspberry Pi OS
- WiFi + SSH working
- USB microphone (or USB sound card + mic)
- This repo copied onto the Pi

## 1. Copy the project onto the Pi

From your PC (after SSH works):

```powershell
scp -r C:\Users\abrah\Downloads\listener YOUR_USER@PI_IP:~/radio-listener
```

Or on the Pi:

```bash
git clone https://github.com/MahmoudALNasra/radio-listener.git ~/radio-listener
```

## 2. Install software

```bash
cd ~/radio-listener/device
chmod +x setup_pi.sh install_service.sh
./setup_pi.sh
```

## 3. Configure

```bash
nano config.json
```

Set at least:

| Field | Value |
|-------|--------|
| `device_id` | `pi-cabin-1` (unique id) |
| `device_name` | `Raspberry Pi 3B+` |
| `supabase_url` | `https://rkjokoykyyejclyxszsk.supabase.co` |
| `supabase_anon_key` | anon/publishable key from Supabase |
| `sync_enabled` | `true` for cloud upload |
| `alert_backend` | `simulate` first; later `gpio` if you wire an LED |
| `input_device` | `null` for default, or index/name from the next step |

## 4. Pick the USB mic

```bash
source .venv/bin/activate
python list_audio_devices.py
arecord -l
```

Put the device index (or a unique name substring) into `input_device` in `config.json`.

## 5. Run once (manual test)

```bash
source .venv/bin/activate
python listener.py
```

Say **crash** (or another keyword). Expect:

- console HIT line
- WAV file under `device/clips/`
- if sync is on: event appears in the web Events page / Supabase

Stop with `Ctrl+C`.

## 6. Auto-start on boot (optional)

```bash
sudo ./install_service.sh
sudo journalctl -u radio-listener-update -u radio-listener -f
```

This installs two services:

1. **`radio-listener-update`** — on every power-on / reboot, waits for network, then `git pull` from GitHub  
2. **`radio-listener`** — starts the keyword listener (after the update attempt)

If Wi‑Fi is down or pull fails, the Pi still starts with the last working code.

### Auto-update from GitHub (private repo)

The repo is private, so the Pi needs read access. Easiest: a **read-only deploy key**.

On the Pi (once):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/radio_listener_deploy -N ""
cat ~/.ssh/radio_listener_deploy.pub
```

1. Copy that public key  
2. GitHub → repo **Settings → Deploy keys → Add deploy key** (read-only)  
3. On the Pi:

```bash
cd ~/radio-listener
git remote set-url origin git@github.com:MahmoudALNasra/radio-listener.git

cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/radio_listener_deploy
  IdentitiesOnly yes
EOF

ssh -T git@github.com
git pull
```

After that, every reboot runs `update_from_git.sh` automatically.

Manual update anytime:

```bash
~/radio-listener/device/update_from_git.sh
sudo systemctl restart radio-listener
```

## GPIO blue LED (optional)

Default pin is **BCM 17** (`gpio_pin` in config).

1. Wire LED + resistor from GPIO17 to GND
2. Set `"alert_backend": "gpio"`
3. Restart the listener

Until the LED is wired, keep `"alert_backend": "simulate"`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No mic / PortAudio error | `python list_audio_devices.py`, try another `input_device` |
| `cannot enable executable stack` / `libvosk.so` | `sudo apt install -y patchelf` then `patchelf --clear-execstack .venv/lib/python*/site-packages/vosk/libvosk.so` (also done by `setup_pi.sh`) |
| Undervoltage / reboots | Use a proper 5V 2.5A+ supply (not weak PC USB power) |
| Sync fails | Confirm `supabase_anon_key`, WiFi, and that schema was applied |
| Service won’t start | `sudo journalctl -u radio-listener -xe` |
