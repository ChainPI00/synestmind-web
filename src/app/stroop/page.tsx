"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StroopEngine } from "@/engines/StroopEngine";
import { useMidiContext } from "@/contexts/MidiContext";
import { useAudio } from "@/hooks/useAudio";
import {
  STROOP_LIMIT,
  STROOP_RESPONSE_TIMEOUT,
} from "@/lib/constants";
import { loadLevel, saveStroopScore } from "@/lib/scores";
import { MidiStatus } from "@/components/MidiStatus";
import { NoteCircle } from "@/components/NoteCircle";
import { EndScreen } from "@/components/EndScreen";

export default function StroopPage() {
  const router = useRouter();
  const { subscribeNoteOn } = useMidiContext();
  const { playNote, stopNote, resume } = useAudio();
  const [started, setStarted] = useState(false);
  const [stroopCur, setStroopCur] = useState<number | null>(null);
  const [stroopCount, setStroopCount] = useState(0);
  const [phase, setPhase] = useState<"stimulus" | "feedback">("stimulus");
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"play" | "end">("play");
  const [accFinal, setAccFinal] = useState(0);

  const engineRef = useRef(new StroopEngine());
  const scoreRef = useRef({ stroop_hits: 0, stroop_misses: 0 });
  const stimulusStartRef = useRef(0);
  const feedbackTimeRef = useRef(0);
  const activeNoteRef = useRef<number | null>(null);
  const nBackRef = useRef(2);

  const reset = useCallback(() => {
    nBackRef.current = loadLevel();
    engineRef.current = new StroopEngine();
    const cur = engineRef.current.nextStimulus();
    setStroopCur(cur);
    setStroopCount(0);
    setPhase("stimulus");
    setFeedbackCorrect(null);
    setMode("play");
    scoreRef.current = { stroop_hits: 0, stroop_misses: 0 };
    stimulusStartRef.current = Date.now() / 1000;
    if (activeNoteRef.current !== null) {
      stopNote(activeNoteRef.current);
      activeNoteRef.current = null;
    }
  }, [stopNote]);

  useEffect(() => {
    if (!started) return;
    reset();
  }, [started, reset]);

  useEffect(() => {
    if (!started || mode === "end" || stroopCur === null) return;

    const unsub = subscribeNoteOn((pitch) => {
      if (phase !== "stimulus") return;
      const noteIndex = pitch % 12;
      const correct = noteIndex === stroopCur;
      scoreRef.current[correct ? "stroop_hits" : "stroop_misses"] += 1;
      setFeedbackCorrect(correct);
      setPhase("feedback");
      feedbackTimeRef.current = Date.now() / 1000 + 0.8;
      if (activeNoteRef.current !== null) stopNote(activeNoteRef.current);
      activeNoteRef.current = 60 + stroopCur;
      playNote(60 + stroopCur);
    });

    return unsub;
  }, [started, mode, stroopCur, phase, subscribeNoteOn, playNote, stopNote]);

  useEffect(() => {
    if (!started || mode === "end") return;

    const interval = setInterval(() => {
      const now = Date.now() / 1000;

      if (phase === "stimulus" && stroopCur !== null && now > stimulusStartRef.current + STROOP_RESPONSE_TIMEOUT) {
        scoreRef.current.stroop_misses += 1;
        setFeedbackCorrect(false);
        setPhase("feedback");
        feedbackTimeRef.current = now + 0.8;
        if (activeNoteRef.current !== null) stopNote(activeNoteRef.current);
        activeNoteRef.current = 60 + stroopCur;
        playNote(60 + stroopCur);
      }

      if (phase === "feedback" && now >= feedbackTimeRef.current) {
        feedbackTimeRef.current = 0;
        const next = stroopCount + 1;
        if (activeNoteRef.current !== null) {
          stopNote(activeNoteRef.current);
          activeNoteRef.current = null;
        }
        if (next < STROOP_LIMIT) {
          const cur = engineRef.current.nextStimulus();
          setStroopCur(cur);
          setStroopCount(next);
          setPhase("stimulus");
          setFeedbackCorrect(null);
          stimulusStartRef.current = Date.now() / 1000;
        } else {
          const acc = (scoreRef.current.stroop_hits / STROOP_LIMIT) * 100;
          saveStroopScore(nBackRef.current, acc, scoreRef.current);
          setAccFinal(acc);
          setMode("end");
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [started, mode, phase, stroopCount, stroopCur, playNote, stopNote]);

  const handleStart = useCallback(async () => {
    await resume();
    setStarted(true);
  }, [resume]);

  if (!started) {
    return (
      <div className="flex min-h-screen flex-col bg-[#141418]">
        <header className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
          <Link href="/stroop-menu" className="text-zinc-400 hover:text-white">
            Indietro
          </Link>
          <MidiStatus />
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <p className="text-center text-zinc-400">
            Suona sul piano la nota che corrisponde al colore. Tocca per avviare.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="min-h-[48px] rounded-xl bg-emerald-600 px-6 py-4 text-lg font-medium text-white hover:bg-emerald-500"
          >
            Avvia Stroop
          </button>
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
          title="Fine Stroop Test!"
          accuracy={accFinal}
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
        <Link href="/stroop-menu" className="text-zinc-400 hover:text-white">
          Indietro
        </Link>
        <MidiStatus />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <span className="text-sm text-zinc-400">
          {stroopCount}/{STROOP_LIMIT}
        </span>

        {stroopCur !== null && (
          <NoteCircle noteIndex={stroopCur} size={120} />
        )}

        {phase === "feedback" && feedbackCorrect !== null && (
          <p className={feedbackCorrect ? "text-green-400" : "text-red-400"}>
            {feedbackCorrect ? "Corretto" : "Sbagliato"}
          </p>
        )}

        <p className="text-center text-sm text-zinc-500">
          Suona sul piano la nota corrispondente al colore
        </p>
      </main>
    </div>
  );
}
