# Free iPhone alerts (ntfy)

When a keyword event syncs (or is uploaded from the phone page), the app can push a notification through [ntfy.sh](https://ntfy.sh) — free, no SMS fees.

## 1. Install on iPhone

1. Install **ntfy** from the App Store: https://apps.apple.com/app/ntfy/id1625396347
2. Open the app → subscribe to your topic (same value as `ntfy_topic` / `NEXT_PUBLIC_NTFY_TOPIC`)
3. Allow notifications when iOS asks

Your current local topic is set in `device/config.json` and `web/.env.local` (gitignored). Treat it like a password — anyone with the topic name can read those alerts.

## 2. Device listener

In `device/config.json`:

```json
"ntfy_enabled": true,
"ntfy_server": "https://ntfy.sh",
"ntfy_topic": "YOUR_SECRET_TOPIC"
```

After a successful Supabase upload, you’ll get a push: keyword + device + transcript.

## 3. Web / phone uploads

In `web/.env.local`:

```env
NEXT_PUBLIC_NTFY_ENABLED=true
NEXT_PUBLIC_NTFY_SERVER=https://ntfy.sh
NEXT_PUBLIC_NTFY_TOPIC=YOUR_SECRET_TOPIC
```

Restart `npm run dev` after changing env vars.

## 4. Quick test

```powershell
cd c:\Users\abrah\Downloads\listener\device
python -c "from notify import NtfyNotifier; NtfyNotifier(topic='YOUR_SECRET_TOPIC', enabled=True).send_event(keyword='test', transcript='hello from listener', device_id='manual-test')"
```

You should see a notification on the iPhone within a few seconds.

## Notes

- Works on Wi‑Fi and cellular
- Free public server: `https://ntfy.sh`
- For higher privacy later, you can self-host ntfy or add a topic password
