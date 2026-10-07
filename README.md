# Radio Keyword Listener

Phase 1: cabin-mic keyword alerts on a laptop or **Raspberry Pi 3B+**, with optional Supabase sync.

## Quick start (Windows laptop)

```powershell
cd c:\Users\abrah\Downloads\listener\device
python -m pip install -r requirements.txt
python download_model.py
python listener.py
```

Say **crash** (or another keyword in `device/config.json`) into the mic.

- Blue popup = simulated LED
- Clips land in `device/clips/`
- Full test checklist: [docs/test-on-lenovo.md](docs/test-on-lenovo.md)

## Raspberry Pi 3B+

Once the Pi has WiFi + SSH:

```bash
cd ~/radio-listener/device
./setup_pi.sh
nano config.json          # set supabase_anon_key + input_device
source .venv/bin/activate
python listener.py
```

Full guide: [docs/setup-raspberry-pi.md](docs/setup-raspberry-pi.md)

## iPhone alerts (free)

Uses [ntfy](https://ntfy.sh) — install the iPhone app, subscribe to your topic, enable `ntfy_*` in `device/config.json` (and web `.env.local` if using phone uploads).

Guide: [docs/iphone-ntfy.md](docs/iphone-ntfy.md)

## Continue on another PC / any Agent

Cursor chats do **not** sync across computers. Shared context is in git:

1. [AGENTS.md](AGENTS.md) — standing instructions (read first)
2. [docs/AGENT_LOG.md](docs/AGENT_LOG.md) — short running change log
3. [docs/handoff-other-pc.md](docs/handoff-other-pc.md) — clone / pull steps

After meaningful work, agents should update those files, then commit + push.

## Layout

| Path | Purpose |
|------|---------|
| `device/` | Python listener (Windows + Raspberry Pi) |
| `device/setup_pi.sh` | Pi install (venv, deps, Vosk model) |
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
