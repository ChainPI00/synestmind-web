"use client";

import { useMidiContext } from "@/contexts/MidiContext";

export function MidiStatus() {
  const { isSupported, isConnected, midiDeviceName, error, requestAccess } =
    useMidiContext();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-900/40 px-3 py-1.5 text-sm text-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        MIDI non supportato
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
    <button
      type="button"
      onClick={requestAccess}
      className="flex items-center gap-2 rounded-lg bg-indigo-700/60 px-3 py-1.5 text-sm text-indigo-100 hover:bg-indigo-600/80 active:bg-indigo-800 transition-colors touch-manipulation"
    >
      <span className="h-2 w-2 rounded-full bg-indigo-400" />
      {error ? "Riprova connessione MIDI" : "Connetti MIDI"}
    </button>
  );
}
