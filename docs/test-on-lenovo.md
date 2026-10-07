# docs/test-on-lenovo.md

## Lenovo Phase 1 test (before buying Pi hardware)

### 1. Install & run listener (local only)

```powershell
cd c:\Users\laalg\Downloads\listener\device
C:\Users\laalg\AppData\Local\Python\bin\python.exe -m pip install -r requirements.txt
C:\Users\laalg\AppData\Local\Python\bin\python.exe download_model.py
C:\Users\laalg\AppData\Local\Python\bin\python.exe listener.py
```

### 2. Test keywords

Default keywords in `config.json`: `crash`, `accident`, `rollover`, `pileup`.

1. Allow microphone access if Windows asks.
2. Clearly say **crash** into the laptop mic.
3. Expect:
   - Console: `BLUE LED ON (simulated)`
   - Blue popup window
   - A WAV under `device/clips/` (~10 seconds: 5 before + 5 after)

### 3. False-trigger check

Have someone else in the room say “crash” — it will also trigger (cabin mic limitation). Note this for Phase 2 wired radios.

### 4. Edit keywords locally

Edit `device/config.json` → `keywords` array → restart `listener.py`.

### 5. Cloud sync (after Supabase is configured)

1. Put `supabase_url` and `supabase_anon_key` in `config.json`.
2. Set `"sync_enabled": true`.
3. Restart listener; events upload to Supabase; web UI shows logs.

### 6. Offline queue

1. Disconnect Wi‑Fi, say a keyword, confirm clip is saved and a JSON appears in `device/queue/`.
2. Reconnect; within ~30s the queue should flush (when sync is enabled).
