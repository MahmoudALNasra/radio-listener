# Agent log

Newest entries at the top. Keep each entry short (what changed + why).  
Agents on **any PC** read this after `AGENTS.md`.

---

## 2026-10-08 — git pull on Pi boot

- Added `device/update_from_git.sh` + `radio-listener-update.service` so each power-on pulls latest `main` before the listener starts
- `install_service.sh` now enables update + listener; pull failures do not block startup
- Documented GitHub deploy-key steps for private repo in `docs/setup-raspberry-pi.md`

## 2026-10-07 — ntfy + Pi software + shared agent docs

- Linked app to Supabase project `rkjokoykyyejclyxszsk` (schema applied remotely; local secrets only)
- Pi support: `setup_pi.sh`, `install_service.sh`, GPIO alerts, `list_audio_devices.py`, `input_device` / `gpio_pin` config
- Free iPhone alerts via ntfy (`device/notify.py`, web `ntfy.ts` + phone upload hook)
- Added `AGENTS.md` + this log so both PCs share standing instructions (chats still do not sync)

## 2026-10-07 — initial clone / baseline

- Repo cloned from `MahmoudALNasra/radio-listener` (device, web, supabase schema, Lenovo-first docs)
