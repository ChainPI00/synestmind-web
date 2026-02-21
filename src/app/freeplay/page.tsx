"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMidiContext } from "@/contexts/MidiContext";
import { useAudio } from "@/hooks/useAudio";
import { gridColor, NOTE_NAMES_IT, NOTE_COLORS } from "@/lib/constants";
import { MidiStatus } from "@/components/MidiStatus";

export default function FreePlayPage() {
  const { subscribeNoteOn, subscribeNoteOff } = useMidiContext();
  const { resume } = useAudio();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [started, setStarted] = useState(false);

  const handleStart = useCallback(async () => {
    await resume();
    setStarted(true);
  }, [resume]);

  useEffect(() => {
    if (!started) return;

    const unsubOn = subscribeNoteOn((pitch) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(pitch);
        return next;
      });
    });

    const unsubOff = subscribeNoteOff((pitch) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(pitch);
        return next;
      });
    });

    return () => {
      unsubOn();
      unsubOff();
    };
  }, [started, subscribeNoteOn, subscribeNoteOff]);

  const COLS = 12;
  const ROWS = 7;

  if (!started) {
    return (
      <div className="flex min-h-screen flex-col bg-[#141418]">
        <header className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
          <Link href="/" className="text-zinc-400 hover:text-white">
            Indietro
          </Link>
          <MidiStatus />
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <h2 className="text-xl font-bold text-zinc-100">Free Play</h2>
          <p className="text-center text-zinc-400">
            Suona il piano e guarda i colori delle note sulla griglia.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="min-h-[48px] rounded-xl bg-purple-600 px-6 py-4 text-lg font-medium text-white hover:bg-purple-500 active:bg-purple-700 touch-manipulation"
          >
            Avvia Free Play
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#141418] text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <Link href="/" className="text-zinc-400 hover:text-white">
          Indietro
        </Link>
        <MidiStatus />
      </header>

      <main className="flex flex-1 flex-col p-4">
        <h1 className="mb-4 text-center text-xl font-bold text-zinc-100">
          Free Play
        </h1>

        {/* Grid */}
        <div className="relative mx-auto w-full max-w-3xl flex-1" style={{ aspectRatio: `${COLS} / ${ROWS}` }}>
          <div
            className="grid h-full w-full gap-px rounded-lg bg-zinc-700"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            }}
          >
            {Array.from({ length: COLS * ROWS }).map((_, i) => (
              <div key={i} className="bg-[#141418]" />
            ))}
          </div>

          {Array.from(activeNotes).map((pitch) => {
            const col = pitch % 12;
            const row = 7 - Math.floor(pitch / 12);
            if (row < 0 || row >= ROWS) return null;
            const [r, g, b] = gridColor(pitch);
            return (
              <div
                key={pitch}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-75"
                style={{
                  left: `${((col + 0.5) / COLS) * 100}%`,
                  top: `${((row + 0.5) / ROWS) * 100}%`,
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold sm:h-12 sm:w-12"
                  style={{
                    backgroundColor: `rgb(${r}, ${g}, ${b})`,
                    color: r + g + b < 400 ? "white" : "black",
                    boxShadow: `0 0 20px 4px rgba(${r}, ${g}, ${b}, 0.6)`,
                  }}
                >
                  {NOTE_NAMES_IT[pitch % 12]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {NOTE_NAMES_IT.map((name, i) => {
            const [r, g, b] = NOTE_COLORS[i];
            return (
              <div key={name} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                />
                <span className="text-xs text-zinc-400">{name}</span>
              </div>
            );
          })}
        </div>

        {activeNotes.size === 0 && (
          <p className="mt-4 text-center text-sm text-zinc-500 animate-pulse">
            Suona una nota sul piano...
          </p>
        )}
      </main>
    </div>
  );
}
