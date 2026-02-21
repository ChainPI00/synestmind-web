"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAudio } from "@/hooks/useAudio";
import { useMidiSimulator } from "@/hooks/useMidiSimulator";
import { NOTE_NAMES_EN, gridColor } from "@/lib/constants";
import { MidiStatus } from "@/components/MidiStatus";
import { TouchButton } from "@/components/TouchButton";
import { EndScreen } from "@/components/EndScreen";

export default function SimulationPage() {
  const router = useRouter();
  const { playNote, stopNote, resume, setVolume, volume } = useAudio();
  const {
    simulator,
    pressedNotes,
    setPressedNotes,
    progress,
    setProgress,
    isFinished,
    setIsFinished,
    error,
    loading,
    load,
    reset,
    totalNotes,
    startTimeRef,
  } = useMidiSimulator();

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"idle" | "play" | "end">("idle");

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!started || mode !== "play" || !simulator) return;

    startTimeRef.current = Date.now() / 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() / 1000 - startTimeRef.current;
      const [toPlay, toRelease] = simulator.getNextNotes(elapsed);

      for (const [pitch, velocity] of toPlay) {
        playNote(pitch, velocity);
      }
      for (const [pitch] of toRelease) {
        stopNote(pitch);
      }

      setPressedNotes(simulator.getPressedNotes());
      const total = simulator.getTotalNotes();
      setProgress(
        total > 0 ? (simulator.currentIndex / total) * 100 : 0
      );

      if (simulator.isFinished()) {
        setIsFinished(true);
        setMode("end");
      }
    }, 50);

    return () => clearInterval(interval);
  }, [started, mode, simulator, playNote, stopNote, setPressedNotes, setProgress, setIsFinished, startTimeRef]);

  const handleStart = useCallback(async () => {
    await resume();
    if (simulator) {
      simulator.reset();
      startTimeRef.current = Date.now() / 1000;
      setPressedNotes([]);
      setProgress(0);
      setIsFinished(false);
      setMode("play");
      setStarted(true);
    }
  }, [resume, simulator, setPressedNotes, setProgress, setIsFinished, startTimeRef]);

  const handleRestart = useCallback(() => {
    if (simulator) {
      reset();
      setMode("play");
      setStarted(true);
    }
  }, [simulator, reset]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#141418] text-zinc-400">
        Caricamento MIDI...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#141418] px-4 text-zinc-400">
        <p className="text-center">{error}</p>
        <p className="text-center text-sm">
          Aggiungi un file MIDI in public/midi/interstellar.mid
        </p>
        <Link href="/" className="text-indigo-400 hover:underline">
          Torna al menu
        </Link>
      </div>
    );
  }

  if (mode === "end") {
    return (
      <div className="min-h-screen bg-[#141418]">
        <header className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
          <Link href="/" className="text-zinc-400 hover:text-white">
            Menu
          </Link>
          <MidiStatus />
        </header>
        <EndScreen
          title="Fine Simulazione!"
          subtitle="INTERSTELLAR completato"
          onRestart={handleRestart}
          onMenu={() => router.push("/")}
        />
      </div>
    );
  }

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
          <p className="text-center text-zinc-400">
            Simulazione MIDI. Tocca per avviare.
          </p>
          <TouchButton variant="neutral" onClick={handleStart}>
            Avvia Simulazione
          </TouchButton>
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
        <h1 className="mb-2 text-center text-xl font-bold">INTERSTELLAR</h1>
        <div className="mb-2 text-sm text-zinc-400">
          Progress: {Math.round(progress)}%
        </div>

        <div className="relative flex-1" style={{ aspectRatio: "12/7" }}>
          <div className="grid grid-cols-12 gap-px rounded-lg bg-zinc-700" style={{ aspectRatio: "12/7" }}>
            {Array.from({ length: 12 * 7 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#141418]" />
            ))}
          </div>
          {pressedNotes.map((pitch) => {
            const col = pitch % 12;
            const row = 7 - Math.floor(pitch / 12);
            if (row < 0 || row >= 7) return null;
            const [r, g, b] = gridColor(pitch);
            return (
              <div
                key={pitch}
                className="absolute flex flex-col items-center justify-center"
                style={{
                  left: `${((col + 0.5) / 12) * 100}%`,
                  top: `${((row + 0.5) / 7) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `rgb(${r}, ${g}, ${b})`,
                    color: r + g + b < 400 ? "white" : "black",
                  }}
                />
                <span className="mt-1 text-xs text-zinc-400">
                  {NOTE_NAMES_EN[pitch % 12]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-zinc-500">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="h-2 w-40 rounded bg-zinc-600"
          />
        </div>
      </main>
    </div>
  );
}
