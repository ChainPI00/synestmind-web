"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StroopEngine } from "@/engines/StroopEngine";
import { useMidiContext } from "@/contexts/MidiContext";
import { useAudio } from "@/hooks/useAudio";
import {
  INVERSE_LIMIT,
  NOTE_NAMES_IT,
  gridColor,
} from "@/lib/constants";
import { saveInverseScore } from "@/lib/scores";
import { MidiStatus } from "@/components/MidiStatus";
import { TouchButton } from "@/components/TouchButton";
import { EndScreen } from "@/components/EndScreen";

export default function InversePage() {
  const router = useRouter();
  const { subscribeNoteOn } = useMidiContext();
  const { playNote, stopNote, resume } = useAudio();
  const [started, setStarted] = useState(false);
  const [inverseCur, setInverseCur] = useState<number | null>(null);
  const [inverseCount, setInverseCount] = useState(0);
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [feedbackTime, setFeedbackTime] = useState(0);
  const [mode, setMode] = useState<"play" | "end">("play");
  const [accFinal, setAccFinal] = useState(0);

  const engineRef = useRef(new StroopEngine());
  const scoreRef = useRef({ inverse_hits: 0, inverse_misses: 0 });
  const activeNoteRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    engineRef.current = new StroopEngine();
    const cur = engineRef.current.nextStimulus();
    setInverseCur(cur);
    setInverseCount(0);
    setFeedbackCorrect(null);
    setFeedbackTime(0);
    setMode("play");
    scoreRef.current = { inverse_hits: 0, inverse_misses: 0 };
    if (activeNoteRef.current !== null) {
      stopNote(activeNoteRef.current);
      activeNoteRef.current = null;
    }
    activeNoteRef.current = 60 + cur;
    playNote(60 + cur);
  }, [playNote, stopNote]);

  useEffect(() => {
    if (!started) return;
    reset();
  }, [started, reset]);

  useEffect(() => {
    if (!started || mode === "end" || inverseCur === null) return;

    const unsub = subscribeNoteOn((pitch) => {
      if (feedbackTime > 0) return;
      const noteIndex = pitch % 12;
      const correct = noteIndex === inverseCur;
      scoreRef.current[correct ? "inverse_hits" : "inverse_misses"] += 1;
      setFeedbackCorrect(correct);
      setFeedbackTime(Date.now() / 1000 + 1);

      if (activeNoteRef.current !== null) {
        stopNote(activeNoteRef.current);
        activeNoteRef.current = null;
      }

      if (inverseCount + 1 < INVERSE_LIMIT) {
        const nextNote = engineRef.current.nextStimulus();
        setTimeout(() => {
          setInverseCur(nextNote);
          setInverseCount((c) => c + 1);
          setFeedbackCorrect(null);
          setFeedbackTime(0);
          activeNoteRef.current = 60 + nextNote;
          playNote(60 + nextNote);
        }, 1000);
      } else {
        setTimeout(() => {
          const acc = (scoreRef.current.inverse_hits / INVERSE_LIMIT) * 100;
          saveInverseScore(acc, scoreRef.current);
          setAccFinal(acc);
          setMode("end");
        }, 1000);
      }
    });

    return unsub;
  }, [started, mode, inverseCur, inverseCount, feedbackTime, subscribeNoteOn, playNote, stopNote]);

  const handleReplay = useCallback(() => {
    if (inverseCur === null || feedbackTime > 0) return;
    if (activeNoteRef.current !== null) stopNote(activeNoteRef.current);
    activeNoteRef.current = 60 + inverseCur;
    playNote(60 + inverseCur);
  }, [inverseCur, feedbackTime, playNote, stopNote]);

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
            Ascolta la nota e suonala sul piano. Tocca per avviare.
          </p>
          <TouchButton variant="danger" onClick={handleStart}>
            Avvia Inverse Stroop
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
          title="Fine Inverse Stroop!"
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
        <Link href="/" className="text-zinc-400 hover:text-white">
          Indietro
        </Link>
        <MidiStatus />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <span className="text-sm text-zinc-400">
          {inverseCount}/{INVERSE_LIMIT}
        </span>

        <p className="text-center text-lg text-zinc-300">
          Ascolta e indovina la nota
        </p>
        <TouchButton variant="neutral" onClick={handleReplay}>
          Riascolta (Spazio)
        </TouchButton>
        <p className="text-center text-sm text-zinc-500">
          Suona sul piano la nota che senti
        </p>

        {feedbackCorrect !== null && (
          <div className="flex flex-col items-center gap-4">
            <p className={feedbackCorrect ? "text-green-400" : "text-red-400"}>
              {feedbackCorrect ? "Corretto" : "Sbagliato"}
            </p>
            {inverseCur !== null && (
              <>
                <p className="text-zinc-300">
                  Nota corretta: {NOTE_NAMES_IT[inverseCur]}
                </p>
                <div
                  className="h-16 w-16 rounded-full"
                  style={{
                    backgroundColor: `rgb(${gridColor(inverseCur).join(",")})`,
                  }}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
