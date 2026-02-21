"use client";

import { useMidiContext } from "@/contexts/MidiContext";

export function MidiStatus() {
  const { isSupported, isConnected, midiDeviceName, error } = useMidiContext();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-900/40 px-3 py-1.5 text-sm text-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        MIDI non supportato
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-900/40 px-3 py-1.5 text-sm text-red-200">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        {error}
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        {midiDeviceName ?? "Piano connesso"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-1.5 text-sm text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-zinc-500" />
      Piano non connesso
    </div>
  );
}
