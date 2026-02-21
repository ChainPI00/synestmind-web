"use client";

import { gridColor } from "@/lib/constants";

interface NoteCircleProps {
  noteIndex: number; // 0-11
  size?: number;
  className?: string;
  highlight?: boolean;
}

export function NoteCircle({
  noteIndex,
  size = 60,
  className = "",
  highlight = false,
}: NoteCircleProps) {
  const [r, g, b] = gridColor(noteIndex);
  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `rgb(${r}, ${g}, ${b})`,
        boxShadow: highlight ? "0 0 0 4px rgba(255,255,255,0.8)" : undefined,
      }}
    />
  );
}
