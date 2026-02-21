"use client";

import { NOTE_COLORS, NOTE_NAMES_IT } from "@/lib/constants";

export function NoteLegend({ title = "Note:" }: { title?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-300">{title}</span>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {NOTE_NAMES_IT.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor: `rgb(${NOTE_COLORS[i][0]}, ${NOTE_COLORS[i][1]}, ${NOTE_COLORS[i][2]})`,
              }}
            />
            <span className="text-sm text-zinc-400">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
