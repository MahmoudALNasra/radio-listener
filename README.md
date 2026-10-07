# Radio Keyword Listener

Phase 1: cabin-mic keyword alerts (test on Lenovo first, then Raspberry Pi Zero).

## Quick start (Lenovo — no hardware purchase needed)

```powershell
cd c:\Users\laalg\Downloads\listener\device
C:\Users\laalg\AppData\Local\Python\bin\python.exe -m pip install -r requirements.txt
C:\Users\laalg\AppData\Local\Python\bin\python.exe download_model.py
C:\Users\laalg\AppData\Local\Python\bin\python.exe listener.py
```

Say **crash** (or another keyword in `device/config.json`) into the laptop mic.

- Blue popup = simulated LED
- Clips land in `device/clips/`
- Full test checklist: [docs/test-on-lenovo.md](docs/test-on-lenovo.md)

## Layout

| Path | Purpose |
|------|---------|
| `device/` | Python listener (Windows + later Pi) |
| `supabase/schema.sql` | Database + storage policies |
| `web/` | Admin keywords + event log (Next.js) |
| `docs/` | Setup / test guides |

## Live site (public)

**https://radio-listener-ten.vercel.app**

| Page | URL |
|------|-----|
| Listen (phone) | https://radio-listener-ten.vercel.app/listen |
| Events | https://radio-listener-ten.vercel.app/ |
| Keywords | https://radio-listener-ten.vercel.app/keywords |
| Devices | https://radio-listener-ten.vercel.app/devices |

### Install on iPhone (no App Store)

1. Open the Listen link in **Safari**
2. Tap **Share** → **Add to Home Screen** → **Add**
3. Open **Listener** from your home screen (full-screen app-like)

## Phone listener

1. Open **https://radio-listener-ten.vercel.app/listen** on your phone (Safari on iPhone).
2. Optionally install via Add to Home Screen (banner on the page explains steps).
3. Tap **Start recording**, allow microphone.
4. Tap **Stop & save** when done (or close Safari).


## Listener with cloud sync

`device/config.json` already points at the radio-listener project with `sync_enabled: true`.
Clips upload to Storage bucket `clips`; events appear on the Events page.

## Phase 2 (later)

Wired radio adapters + mixer; set `audio_source` to `radio_line`. Same software.
