# Continue on another PC

## Chats do not sync

Same Cursor email ≠ shared Agent history. Use **git + `AGENTS.md` + `docs/AGENT_LOG.md`**.

## On the other PC

1. `git clone https://github.com/MahmoudALNasra/radio-listener.git` (or `git pull` if already cloned)
2. Open the folder in Cursor
3. Start a new Agent and say: **read `AGENTS.md` and `docs/AGENT_LOG.md` first**
4. Recreate secrets (not in git):
   - `device/config.json` from `config.pi.example.json` / `config.example.json` + your keys
   - `web/.env.local` from `web/.env.example` + your keys / ntfy topic

## After any agent finishes work (either PC)

1. Update **Status** in `AGENTS.md` if it changed
2. Append a short entry to `docs/AGENT_LOG.md`
3. Commit and push so the other PC can `git pull`
