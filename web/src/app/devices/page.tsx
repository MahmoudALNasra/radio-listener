"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Device = {
  id: string;
  name: string;
  audio_source: "cabin_mic" | "radio_line";
  last_seen: string | null;
};

const RADIO_FAMILIES = [
  "M1 / 2-pin",
  "XPR / MOTOTRBO",
  "APX / SRX",
  "XTS",
  "Other / unknown",
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: qErr } = await supabase
      .from("devices")
      .select("*")
      .order("name");
    if (qErr) setError(qErr.message);
    else setDevices((data as Device[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setAudioSource(
    id: string,
    audio_source: Device["audio_source"]
  ) {
    await supabase.from("devices").update({ audio_source }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Devices</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Phase 1 uses cabin mic. Switch to radio line when adapters/mixer are
          ready. Radio family list is a shopping checklist for Phase 2.
        </p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <ul className="space-y-4">
        {devices.map((d) => (
          <li
            key={d.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
          >
            <div className="font-medium">{d.name}</div>
            <div className="text-xs text-zinc-500">{d.id}</div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              Audio mode
              <select
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
                value={d.audio_source}
                onChange={(e) =>
                  setAudioSource(
                    d.id,
                    e.target.value as Device["audio_source"]
                  )
                }
              >
                <option value="cabin_mic">Cabin mic</option>
                <option value="radio_line">Radio line (Phase 2)</option>
              </select>
            </label>
            <div className="mt-3 text-xs text-zinc-500">
              Phase 2 adapter families (multi-select checklist):{" "}
              {RADIO_FAMILIES.join(" · ")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
