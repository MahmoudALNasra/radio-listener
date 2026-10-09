# Agent instructions (both PCs)

Read this file **first** on any machine before changing the project.
Keep it accurate: when you finish meaningful work, update **Status**, append **AGENT_LOG**, then commit + push if the user wants git updated.

## Cross-PC rule

Cursor Agent **chats do not sync** across PCs (same email does not matter).
Shared truth lives in this **git repo**:

- `AGENTS.md` — standing instructions (this file)
- `docs/AGENT_LOG.md` — short running log of what changed
- `README.md` + `docs/*` — how to run things

**Every agent session that changes the project should:**
1. Skim `AGENTS.md` + latest entries in `docs/AGENT_LOG.md`
2. Do the work
3. Update Status below + append a log entry
4. Commit (and push when asked) — never commit secrets

## Secrets (never commit)

| File | Purpose |
|------|---------|
| `device/config.json` | device id, Supabase anon key, ntfy topic |
| `web/.env.local` | Supabase + ntfy for Next.js |

Use examples: `device/config.example.json`, `device/config.pi.example.json`, `web/.env.example`.

## Stack

| Piece | Notes |
|-------|--------|
| Device listener | `device/` Python + Vosk, Windows or Raspberry Pi 3B+ |
| Web admin / phone | `web/` Next.js |
| Backend | Supabase project **listener** `rkjokoykyyejclyxszsk` |
| Alerts | Free **ntfy.sh** → iPhone app (not SMS yet) |
| Repo | https://github.com/MahmoudALNasra/radio-listener |

## Status (update when this changes)

- **Supabase:** schema applied (profiles, devices, keywords, events, clips bucket + RLS)
- **Pi software:** `setup_pi.sh`, systemd services, GPIO alert, USB mic `input_device`, **git pull on every boot** (`radio-listener-update.service`)
- **Pi hardware:** user flashing OS / first boot (WiFi+SSH via Imager); needs deploy key for private-repo auto-update
- **ntfy:** wired in device sync + web phone uploads; topic lives only in local secret files
- **LLM / addresses:** not built yet — plan free Gemini later for reason + address extraction
- **SMS:** deferred; use ntfy for now
- **Radio direct audio:** user has Motorola XTL 2500 mobile (`M21URM9PW1AN`), used as a **fixed indoor station** (not a vehicle). Full illustrated guide `docs/xtl2500-build-guide.pdf` (rear J2 pin 21/14 → HLN6863B → 2.2 µF → isolator → UGREEN USB; 13.8 V / 20 A supply + HKN4191C; 800 MHz mag-mount antenna). Notes in `docs/xtl2500-direct-audio.md`, session summary in `docs/xtl2500-chat-2026-10-08.md`. Parts not ordered yet.

## Next priorities

1. Pi online (WiFi + SSH) → run `device/setup_pi.sh`, set mic + keys, test keyword → Supabase → ntfy
2. Optional: Gemini free tier for related phrases + address parsing
3. Optional: tighten ntfy (auth / self-host) before making topic public anywhere

## Key docs

- [docs/setup-raspberry-pi.md](docs/setup-raspberry-pi.md)
- [docs/iphone-ntfy.md](docs/iphone-ntfy.md)
- [docs/handoff-other-pc.md](docs/handoff-other-pc.md)
- [docs/AGENT_LOG.md](docs/AGENT_LOG.md)
- [docs/test-on-lenovo.md](docs/test-on-lenovo.md)
- [docs/xtl2500-direct-audio.md](docs/xtl2500-direct-audio.md)
- [docs/xtl2500-build-guide.pdf](docs/xtl2500-build-guide.pdf) — illustrated station build
- [docs/xtl2500-shopping-links.md](docs/xtl2500-shopping-links.md) — Amazon / Walmart buy links
- [docs/xtl2500-build-guide.pdf](docs/xtl2500-build-guide.pdf) — illustrated station build guide (source: `docs/xtl2500-build-guide.html`)
- [docs/xtl2500-chat-2026-10-08.md](docs/xtl2500-chat-2026-10-08.md) — decisions / Q&A from the guide session
