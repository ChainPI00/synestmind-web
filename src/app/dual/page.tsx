"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NBackEngine } from "@/engines/NBackEngine";
import { useAudio } from "@/hooks/useAudio";
import {
  INTERVAL,
  NOTE_LIMIT,
  NOTE_NAMES_IT,
  gridColor,
} from "@/lib/constants";
import {
  loadLevel,
  saveLevel,
  saveDualScore,
  lastTwoDual,
} from "@/lib/scores";
import { MidiStatus } from "@/components/MidiStatus";
import { TouchButton } from "@/components/TouchButton";
import { EndScreen } from "@/components/EndScreen";

export default function DualPage() {
  const router = useRouter();
  const { playNote, stopNote, resume, isReady } = useAudio();
  const [started, setStarted] = useState(false);
  const [nBack, setNBack] = useState(2);
  const [curP, setCurP] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [respondedNote, setRespondedNote] = useState(false);
  const [respondedOct, setRespondedOct] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "nota" | "ottava";
    correct: boolean;
  } | null>(null);
  const [mode, setMode] = useState<"play" | "end">("play");
  const [accFinal, setAccFinal] = useState(0);
  const [levelChange, setLevelChange] = useState<1 | -1 | 0>(0);

  const engineRef = useRef<NBackEngine | null>(null);
  const nextTRef = useRef(0);
  const endGameTimeRef = useRef(0);
  const activeNoteRef = useRef<number | null>(null);
  const scoreRef = useRef({
    note_hits: 0,
    note_misses: 0,
    oct_hits: 0,
    oct_misses: 0,
  });
  const curPRef = useRef<number | null>(null);
  const countRef = useRef(0);
  const respondedNoteRef = useRef(false);
  const respondedOctRef = useRef(false);
  curPRef.current = curP;
  countRef.current = count;
  respondedNoteRef.current = respondedNote;
  respondedOctRef.current = respondedOct;

  const reset = useCallback(() => {
    const n = loadLevel();
    setNBack(n);
    engineRef.current = new NBackEngine(n);
    engineRef.current.reset();
    nextTRef.current = Date.now() / 1000 + INTERVAL;
    endGameTimeRef.current = 0;
    activeNoteRef.current = null;
    scoreRef.current = {
      note_hits: 0,
      note_misses: 0,
      oct_hits: 0,
      oct_misses: 0,
    };
    setCurP(null);
    setCount(0);
    setRespondedNote(false);
    setRespondedOct(false);
    setFeedback(null);
    setMode("play");
  }, []);

  useEffect(() => {
    if (!started) return;
    reset();
  }, [started, reset]);

  useEffect(() => {
    if (!started || mode === "end" || !engineRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now() / 1000;
      const nextT = nextTRef.current;
      const countCurrent = countRef.current;
      const engine = engineRef.current!;

      if (now >= nextT && countCurrent < NOTE_LIMIT) {
        const cur = curPRef.current;
        const respNote = respondedNoteRef.current;
        const respOct = respondedOctRef.current;
        const score = scoreRef.current;

        if (cur !== null) {
          const [noteMatch, octMatch] = engine.evaluate(cur);
          if (noteMatch && respNote) score.note_hits += 1;
          else if (noteMatch && !respNote) score.note_misses += 1;
          else if (!noteMatch && respNote) score.note_misses += 1;
          if (octMatch && respOct) score.oct_hits += 1;
          else if (octMatch && !respOct) score.oct_misses += 1;
          else if (!octMatch && respOct) score.oct_misses += 1;
        }

        if (activeNoteRef.current !== null) {
          stopNote(activeNoteRef.current);
        }
        const p = engine.nextStimulus();
        activeNoteRef.current = p;
        playNote(p);
        nextTRef.current = nextT + INTERVAL;
        curPRef.current = p;
        countRef.current = countCurrent + 1;
        respondedNoteRef.current = false;
        respondedOctRef.current = false;
        setCurP(p);
        setCount(countCurrent + 1);
        setRespondedNote(false);
        setRespondedOct(false);

        if (countCurrent + 1 === NOTE_LIMIT) {
          endGameTimeRef.current = nextT + INTERVAL + 2;
        }
      } else if (
        countCurrent >= NOTE_LIMIT &&
        (endGameTimeRef.current === 0 || now >= endGameTimeRef.current)
      ) {
        if (activeNoteRef.current !== null) {
          stopNote(activeNoteRef.current);
          activeNoteRef.current = null;
        }
        const score = scoreRef.current;
        const total =
          score.note_hits +
          score.note_misses +
          score.oct_hits +
          score.oct_misses || 1;
        const acc = ((score.note_hits + score.oct_hits) / total) * 100;
        const oldN = nBack;
        saveDualScore(nBack, acc, score);
        if (acc >= 90) {
          const newN = nBack + 1;
          saveLevel(newN);
          setNBack(newN);
          setLevelChange(1);
        } else {
          const last2 = lastTwoDual(nBack);
          if (last2.length >= 2 && last2.every((a) => a <= 70)) {
            const newN = Math.max(2, nBack - 1);
            saveLevel(newN);
            setNBack(newN);
            setLevelChange(-1);
          } else {
            setLevelChange(0);
          }
        }
        setAccFinal(acc);
        setMode("end");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [started, mode, nBack, playNote, stopNote]);

  const handleNote = useCallback(() => {
    if (curP === null || respondedNote) return;
    setRespondedNote(true);
    const [match] = engineRef.current!.evaluate(curP);
    setFeedback({ type: "nota", correct: match });
    setTimeout(() => setFeedback(null), 500);
  }, [curP, respondedNote]);

  const handleOct = useCallback(() => {
    if (curP === null || respondedOct) return;
    setRespondedOct(true);
    const [, match] = engineRef.current!.evaluate(curP);
    setFeedback({ type: "ottava", correct: match });
    setTimeout(() => setFeedback(null), 500);
  }, [curP, respondedOct]);

  const handleStart = useCallback(async () => {
    await resume();
    setStarted(true);
  }, [resume]);

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
            Tocca per avviare e abilitare l&apos;audio
          </p>
          <TouchButton variant="primary" onClick={handleStart}>
            Avvia Dual-Music-Back
          </TouchButton>
        </main>
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
          title="Fine Dual-Music-Back!"
          subtitle={`Livello: ${nBack}`}
          accuracy={accFinal}
          levelChange={levelChange}
          onRestart={() => {
            setStarted(true);
            reset();
          }}
          onMenu={() => router.push("/")}
        />
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

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-blue-400">n-back: {nBack}</span>
          <span className="text-sm text-zinc-400">
            {count}/{NOTE_LIMIT}
          </span>
        </div>

        {feedback && (
          <p
            className={`text-center text-sm ${
              feedback.correct ? "text-green-400" : "text-red-400"
            }`}
          >
            {feedback.correct ? "Corretta" : "Errata"} - {feedback.type}
          </p>
        )}

        <div className="relative flex-1 px-2 py-4">
          <div className="grid grid-cols-12 gap-px rounded-lg bg-zinc-700" style={{ aspectRatio: "12/7" }}>
            {Array.from({ length: 12 * 7 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#141418]" />
            ))}
          </div>
          {curP !== null && (
            <div
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{
                left: `${((curP % 12) + 0.5) / 12 * 100}%`,
                top: `${(7 - Math.floor(curP / 12) + 0.5) / 7 * 100}%`,
              }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-medium sm:h-12 sm:w-12"
                style={{
                  backgroundColor: `rgb(${gridColor(curP).join(",")})`,
                  color: gridColor(curP).reduce((a, b) => a + b, 0) < 400 ? "white" : "black",
                }}
              />
              <span className="mt-1 text-xs text-zinc-400">
                {NOTE_NAMES_IT[curP % 12]}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 p-4">
          <TouchButton variant="primary" onClick={handleNote} className="w-full">
            Stessa nota
          </TouchButton>
          <TouchButton variant="secondary" onClick={handleOct} className="w-full">
            Stessa ottava
          </TouchButton>
        </div>
      </main>
    </div>
  );
}
