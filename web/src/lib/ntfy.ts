/** Free iPhone push via ntfy.sh (topic must stay private-ish). */

const server = (process.env.NEXT_PUBLIC_NTFY_SERVER || "https://ntfy.sh").replace(
  /\/$/,
  ""
);
const topic = process.env.NEXT_PUBLIC_NTFY_TOPIC || "";

export function ntfyEnabled() {
  return Boolean(topic && process.env.NEXT_PUBLIC_NTFY_ENABLED === "true");
}

export async function sendNtfyEvent(opts: {
  keyword: string;
  transcript: string;
  deviceId: string;
  triggeredAt?: string;
}) {
  if (!ntfyEnabled()) return false;
  const title = `Listener: ${opts.keyword}`;
  const lines = [`Device: ${opts.deviceId}`];
  if (opts.transcript) lines.push(opts.transcript);
  if (opts.triggeredAt) lines.push(opts.triggeredAt);
  const res = await fetch(`${server}/${topic}`, {
    method: "POST",
    headers: {
      Title: title,
      Priority: "5",
      Tags: "rotating_light,warning",
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: lines.join("\n"),
  });
  if (!res.ok) {
    throw new Error(`ntfy failed: ${res.status}`);
  }
  return true;
}
