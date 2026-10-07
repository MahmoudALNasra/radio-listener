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
sudo journalctl -u radio-listener -f
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
| Undervoltage / reboots | Use a proper 5V 2.5A+ supply (not weak PC USB power) |
| Sync fails | Confirm `supabase_anon_key`, WiFi, and that schema was applied |
| Service won’t start | `sudo journalctl -u radio-listener -xe` |
