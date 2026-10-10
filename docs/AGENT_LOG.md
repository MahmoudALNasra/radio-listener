# Agent log

Newest entries at the top. Keep each entry short (what changed + why).  
Agents on **any PC** read this after `AGENTS.md`.

---

## 2026-10-10 — picture for every build step in the XTL 2500 guide (PC abrah)

- `docs/xtl2500-build-guide.pdf` / `.html`: each of the 13 steps now has a figure beside it — exact drawings (cut point, plug tip/ring/sleeve + beep table, 4-panel capacitor splice, crimp-pin anatomy, pin-into-housing cut-away, supply posts, Windows Sound page), crops of the user's own radio photos with arrows on J2 / POWER / antenna / power button, a photo chain plug→isolator→UGREEN→PC, and a real `config.json` / `list_audio_devices.py` snippet
- 4 new hands-on photos in `docs/xtl2500-parts/step-*.jpg` (AI look-alikes, generic parts)
- Step 13 now uses the real helper `device/list_audio_devices.py` and `audio_source: radio_line`

## 2026-10-08 — XTL 2500 illustrated build guide + station context (PC abrah)

- Setup clarified: **fixed indoor station**, radio receives → PC transcribes → keyword triggers; no cabin mic, no speaker
- Added `docs/xtl2500-build-guide.pdf` (+ `.html` source, `docs/xtl2500-parts/` images): overview diagram, user's rear-panel photo with socket callouts, parts A–J with pictures/search text/prices, connection map, cable-build drawing, 13 steps, troubleshooting
- Power: 13.8 V / 20 A+ supply + HKN4191C; ignition lead on (+). Antenna: 800 MHz mag-mount, mini-UHF
- Added `docs/xtl2500-chat-2026-10-08.md` (session Q&A + verified facts) and a station note at the top of `docs/xtl2500-direct-audio.md`

## 2026-10-09 — Amazon / Walmart shopping links for XTL parts

- Pulled latest (build guide PDF + parts photos already on main)
- Added `docs/xtl2500-shopping-links.md`: which A–J parts are on Amazon vs Walmart vs radio shops, with direct product URLs
- Walmart: isolator, USB sound card, aux cable, maybe cheap PSU. Motorola HLN6863B / crimp pins / HKN4191: Amazon specialty or radio shops only

## 2026-10-08 — XTL 2500 direct-audio plan

- Radio identified: Motorola XTL 2500 mobile `M21URM9PW1AN`
- Added `docs/xtl2500-direct-audio.md`: rear 26-pin J2 pin 21 (fixed RX audio) + pin 14 → cap → isolator → UGREEN USB sound card; fallback speaker-wire LOC; shopping list with links/prices
- Software follow-ups listed in the doc (audio gate, clip bracketing, level check)

## 2026-10-08 — Pi listening works; fix events RLS for anon upload

- Pi hit keyword `crash`, saved local WAV; upload failed with events RLS 42501
- Added `supabase/fix_anon_events_rls.sql` to re-apply anon insert/read + ensure `pi-cabin-1` device exists
- Note: config may point at project `rkjokoykyyejclyxszsk` (other-PC); MCP can manage `kvrzyjtcxmqxhinfxytq`

## 2026-10-08 — USB mic sample-rate resample for Pi

- Error: `Invalid sample rate` opening mic at 16 kHz (USB lav often 44.1/48 kHz only)
- `listener.py` now picks a supported capture rate and resamples to 16 kHz for Vosk/clips

## 2026-10-08 — fix Vosk libvosk.so execstack on Pi

- Pi error: `cannot enable executable stack` loading `libvosk.so` (Python 3.13 venv)
- `setup_pi.sh` now installs `execstack` and clears the bit on `libvosk.so` after pip install
- Documented one-liner fix in `docs/setup-raspberry-pi.md` troubleshooting

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
