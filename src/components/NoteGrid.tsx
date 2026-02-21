"use client";

import { gridColor, NOTE_NAMES_IT, NOTE_NAMES_EN } from "@/lib/constants";

interface NoteGridProps {
  activeNotes: number[]; // MIDI pitches
  useEnglishNames?: boolean;
  cols?: number;
  rows?: number;
}

export function NoteGrid({
  activeNotes,
  useEnglishNames = false,
  cols = 12,
  rows = 7,
}: NoteGridProps) {
  const names = useEnglishNames ? NOTE_NAMES_EN : NOTE_NAMES_IT;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${cols} / ${rows}` }}>
      {/* Grid lines */}
      <div className="absolute inset-0 grid gap-px bg-zinc-700" style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div key={i} className="bg-[#141418]" />
        ))}
      </div>
      {/* Active note circles */}
      {activeNotes.map((pitch) => {
        const col = pitch % 12;
        const row = 7 - Math.floor(pitch / 12); // row 0 top, bottom row = 6
        if (row < 0 || row >= rows) return null;
        const [r, g, b] = gridColor(pitch);
        const name = names[pitch % 12];
        return (
          <div
            key={pitch}
            className="absolute flex flex-col items-center justify-center"
            style={{
              left: `${col * cellWidth + cellWidth / 2}%`,
              top: `${row * cellHeight + cellHeight / 2}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-medium sm:h-12 sm:w-12"
              style={{
                backgroundColor: `rgb(${r}, ${g}, ${b})`,
                color: r + g + b < 400 ? "white" : "black",
              }}
            />
            <span className="mt-1 text-xs text-zinc-400">{name}</span>
          </div>
        );
      })}
    </div>
  );
}
