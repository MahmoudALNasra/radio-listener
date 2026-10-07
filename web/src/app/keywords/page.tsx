"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Keyword, supabase } from "@/lib/supabase";

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: qErr } = await supabase
      .from("keywords")
      .select("*")
      .order("text");
    if (qErr) setError(qErr.message);
    else setKeywords((data as Keyword[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const value = text.trim().toLowerCase();
    if (!value) return;
    setError(null);
    const { error: insErr } = await supabase
      .from("keywords")
      .insert({ text: value, active: true });
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setText("");
    load();
  }

  async function toggle(kw: Keyword) {
    await supabase
      .from("keywords")
      .update({ active: !kw.active })
      .eq("id", kw.id);
    load();
  }

  async function remove(kw: Keyword) {
    await supabase.from("keywords").delete().eq("id", kw.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Keywords</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Active keywords sync to the listener about every 30 seconds when sync
          is enabled.
        </p>
      </div>

      <form onSubmit={onAdd} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. wreck"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
        >
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {keywords.map((kw) => (
          <li
            key={kw.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <span className="font-medium">{kw.text}</span>
              <span
                className={`ml-2 text-xs ${kw.active ? "text-emerald-400" : "text-zinc-500"}`}
              >
                {kw.active ? "active" : "off"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggle(kw)}
                className="rounded bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
              >
                {kw.active ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                onClick={() => remove(kw)}
                className="rounded bg-red-950 px-2 py-1 text-xs text-red-300 hover:bg-red-900"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
