"use client";

import { useCallback, useState } from "react";

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-[44px] min-w-[44px] rounded-lg bg-zinc-700/50 px-2 text-zinc-400 hover:bg-zinc-600 hover:text-white"
      title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
      aria-label={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
    >
      {isFullscreen ? "⛶" : "⛶"}
    </button>
  );
}
