"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { EventRow, supabase } from "@/lib/supabase";

type EventWithUrl = EventRow & { url?: string | null };

async function clipUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("clips")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Stable audio element — only remounts when src string changes. */
const ClipAudio = memo(function ClipAudio({
  src,
  onPlayingChange,
}: {
  src: string;
  onPlayingChange: (playing: boolean) => void;
}) {
  return (
    <audio
      className="mt-3 w-full"
      controls
      preload="metadata"
      src={src}
      onPlay={() => onPlayingChange(true)}
      onPause={() => onPlayingChange(false)}
      onEnded={() => onPlayingChange(false)}
    />
  );
});

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventsRef = useRef<EventWithUrl[]>([]);
  const playingCountRef = useRef(0);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const onPlayingChange = useCallback((playing: boolean) => {
    playingCountRef.current = Math.max(
      0,
      playingCountRef.current + (playing ? 1 : -1)
    );
  }, []);

  const load = useCallback(async (background = false) => {
    // Don't interrupt playback with a refresh
    if (background && playingCountRef.current > 0) return;

    if (!background) {
      setLoading(true);
      setError(null);
    }

    const { data, error: qErr } = await supabase
      .from("events")
      .select("*")
      .order("triggered_at", { ascending: false })
      .limit(50);

    if (qErr) {
      if (!background) {
        setError(qErr.message);
        setLoading(false);
      }
      return;
    }

    // If user started playback while we were fetching, skip applying
    if (background && playingCountRef.current > 0) return;

    const prevByPath = new Map<string, string>();
    for (const ev of eventsRef.current) {
      if (ev.clip_path && ev.url) prevByPath.set(ev.clip_path, ev.url);
    }

    const rows: EventWithUrl[] = await Promise.all(
      ((data as EventRow[]) || []).map(async (row) => {
        if (!row.clip_path) return { ...row, url: null };
        const cached = prevByPath.get(row.clip_path);
        if (cached) return { ...row, url: cached };
        return { ...row, url: await clipUrl(row.clip_path) };
      })
    );

    if (background && playingCountRef.current > 0) return;

    setEvents(rows);
    if (!background) setLoading(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    void load(false);
    const id = setInterval(() => void load(true), 8000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Event log</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Keyword hits and full session recordings. Auto-refresh pauses while
            audio is playing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      {loading && events.length === 0 && (
        <p className="text-sm text-zinc-400">Loading…</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && events.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
          No events yet. Use{" "}
          <code className="text-zinc-200">/listen</code> or the Lenovo listener.
        </p>
      )}

      <ul className="space-y-4">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="rounded bg-sky-600/20 px-2 py-0.5 text-sm font-medium text-sky-300">
                {ev.keyword}
              </span>
              <time className="text-xs text-zinc-500">
                {new Date(ev.triggered_at).toLocaleString()}
              </time>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              {ev.transcript || "(no transcript)"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">device: {ev.device_id}</p>
            {ev.url ? (
              <ClipAudio src={ev.url} onPlayingChange={onPlayingChange} />
            ) : (
              <p className="mt-2 text-xs text-zinc-600">No clip</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
