import { supabase } from "./supabase";

const DEVICE_KEY = "listener_phone_device_id";
const NAME_KEY = "listener_phone_device_name";

export function getPhoneDeviceId(): string {
  if (typeof window === "undefined") return "phone-ssr";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `phone-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getPhoneDeviceName(): string {
  if (typeof window === "undefined") return "Phone";
  let name = localStorage.getItem(NAME_KEY);
  if (!name) {
    name = `Phone ${getPhoneDeviceId().slice(-4)}`;
    localStorage.setItem(NAME_KEY, name);
  }
  return name;
}

export async function ensurePhoneDevice() {
  const id = getPhoneDeviceId();
  const name = getPhoneDeviceName();
  await supabase.from("devices").upsert({
    id,
    name,
    audio_source: "cabin_mic",
    last_seen: new Date().toISOString(),
  });
  return { id, name };
}

function extForBlob(blob: Blob, fallback: string) {
  if (blob.type.includes("mp4")) return "mp4";
  if (blob.type.includes("webm")) return "webm";
  if (blob.type.includes("wav")) return "wav";
  return fallback;
}

export async function uploadPhoneEvent(opts: {
  deviceId: string;
  keyword: string;
  transcript: string;
  blob: Blob;
  fileExt?: string;
}) {
  const triggeredAt = new Date().toISOString();
  const ext = opts.fileExt || extForBlob(opts.blob, "webm");
  const fileName = `${triggeredAt.replace(/[:.]/g, "-")}_${opts.keyword}.${ext}`;
  const storagePath = `${opts.deviceId}/${fileName}`;

  const { error: upErr } = await supabase.storage
    .from("clips")
    .upload(storagePath, opts.blob, {
      contentType: opts.blob.type || `audio/${ext}`,
      upsert: true,
    });
  if (upErr) throw upErr;

  const { error: insErr } = await supabase.from("events").insert({
    device_id: opts.deviceId,
    keyword: opts.keyword,
    transcript: opts.transcript,
    clip_path: storagePath,
    triggered_at: triggeredAt,
  });
  if (insErr) throw insErr;

  await supabase
    .from("devices")
    .update({ last_seen: triggeredAt })
    .eq("id", opts.deviceId);

  return { storagePath, triggeredAt };
}

/** Back-compat helper used by older desktop clip path */
export async function uploadPhoneEventWav(opts: {
  deviceId: string;
  keyword: string;
  transcript: string;
  wav: Blob;
}) {
  return uploadPhoneEvent({
    deviceId: opts.deviceId,
    keyword: opts.keyword,
    transcript: opts.transcript,
    blob: opts.wav,
    fileExt: "wav",
  });
}
