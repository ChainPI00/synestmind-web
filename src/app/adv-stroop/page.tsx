"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StroopEngine } from "@/engines/StroopEngine";
import { useMidiContext } from "@/contexts/MidiContext";
import { useAudio } from "@/hooks/useAudio";
import {
  ADV_STROOP_LIMIT,
  ADV_STROOP_NOTES,
  NOTE_COLORS,
  NOTE_NAMES_IT,
} from "@/lib/constants";
import { loadLevel, saveAdvStroopScore } from "@/lib/scores";
import { MidiStatus } from "@/components/MidiStatus";
import { TouchButton } from "@/components/TouchButton";
import { EndScreen } from "@/components/EndScreen";

export default function AdvStroopPage() {
  const router = useRouter();
  const { subscribeNoteOn } = useMidiContext();
  const { playNote, stopNote, resume } = useAudio();
  const [started, setStarted] = useState(false);
  const [notes, setNotes] = useState<number[]>([]);
  const [input, setInput] = useState<(number | null)[]>([]);
  const [currentPos, setCurrentPos] = useState(0);
  const [phase, setPhase] = useState<"stimulus" | "feedback">("stimulus");
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [feedbackEndTime, setFeedbackEndTime] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [mode, setMode] = useState<"play" | "end">("play");
  const [accFinal, setAccFinal] = useState(0);

  const engineRef = useRef(new StroopEngine());
  const scoreRef = useRef({ adv_stroop_hits: 0, adv_stroop_misses: 0 });
  const activeNotesRef = useRef<number[]>([]);
  const nBackRef = useRef(2);

  const startRound = useCallback(() => {
    const newNotes = Array.from(
      { length: ADV_STROOP_NOTES },
      () => engineRef.current.nextStimulus()
    );
    setNotes(newNotes);
    setInput(Array(ADV_STROOP_NOTES).fill(null));
    setCurrentPos(0);
    setPhase("stimulus");
    setFeedbackCorrect(null);
    activeNotesRef.current.forEach((p) => stopNote(p));
    activeNotesRef.current = newNotes.map((n) => 60 + n);
    newNotes.forEach((n) => playNote(60 + n));
  }, [playNote, stopNote]);

  const reset = useCallback(() => {
    nBackRef.current = loadLevel();
    engineRef.current = new StroopEngine();
    scoreRef.current = { adv_stroop_hits: 0, adv_stroop_misses: 0 };
    setRoundCount(0);
    setMode("play");
    startRound();
  }, [startRound]);

  useEffect(() => {
    if (!started) return;
    reset();
  }, [started, reset]);

  useEffect(() => {
    if (!started || mode === "end" || phase !== "stimulus") return;

    const unsub = subscribeNoteOn((pitch) => {
      const noteVal = pitch % 12;
      if (currentPos >= notes.length) return;
      const correct = noteVal === notes[currentPos] % 12;
      setInput((prev) => {
        const next = [...prev];
        next[currentPos] = noteVal;
        return next;
      });
      setCurrentPos((p) => {
        const next = p + 1;
        if (next === notes.length) {
          const fullInput = [...input.slice(0, p), noteVal];
          const finalCorrect = fullInput.every((val, i) => val === notes[i] % 12);
          scoreRef.current[finalCorrect ? "adv_stroop_hits" : "adv_stroop_misses"] += 1;
          setFeedbackCorrect(finalCorrect);
          setPhase("feedback");
          setFeedbackEndTime(Date.now() / 1000 + 1.5);
        }
        return next;
      });
    });

    return unsub;
  }, [started, mode, phase, currentPos, notes, input, subscribeNoteOn]);

  useEffect(() => {
    if (!started || mode === "end" || phase !== "feedback") return;

    const interval = setInterval(() => {
      if (Date.now() / 1000 < feedbackEndTime) return;
      setFeedbackEndTime(0);
      activeNotesRef.current.forEach((p) => stopNote(p));
      activeNotesRef.current = [];

      setRoundCount((c) => {
        const next = c + 1;
        if (next < ADV_STROOP_LIMIT) {
          startRound();
        } else {
          const acc = (scoreRef.current.adv_stroop_hits / ADV_STROOP_LIMIT) * 100;
          saveAdvStroopScore(nBackRef.current, acc, scoreRef.current);
          setAccFinal(acc);
          setMode("end");
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [started, mode, phase, feedbackEndTime, startRound, stopNote]);

  const handleReplay = useCallback(() => {
    if (phase !== "stimulus" || notes.length === 0) return;
    activeNotesRef.current.forEach((p) => stopNote(p));
    notes.forEach((n) => playNote(60 + n));
    activeNotesRef.current = notes.map((n) => 60 + n);
  }, [phase, notes, playNote, stopNote]);

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
            Ascolta le note e suonale sul piano nell&apos;ordine. Tocca per avviare.
          </p>
          <TouchButton variant="danger" onClick={handleStart}>
            Avvia Advantage Stroop
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
          title="Fine Advantage Stroop!"
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

      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Advantage Stroop</h1>
        <span className="mb-2 text-sm text-zinc-400">
          {roundCount}/{ADV_STROOP_LIMIT}
        </span>

        {phase === "feedback" && feedbackCorrect !== null && (
          <div className="mb-4 text-center">
            <p className={feedbackCorrect ? "text-green-400" : "text-red-400"}>
              {feedbackCorrect ? "Corretto" : "Sbagliato"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Note corrette:</p>
            <div className="mt-2 flex justify-center gap-4">
              {notes.map((n, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="h-10 w-10 rounded-full"
                    style={{
                      backgroundColor: `rgb(${NOTE_COLORS[n % 12].join(",")})`,
                    }}
                  />
                  <span className="mt-1 text-xs text-white">
                    {NOTE_NAMES_IT[n % 12]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "stimulus" && (
          <>
            <p className="mb-2 text-center text-zinc-400">
              Posizione: {currentPos + 1}/{notes.length}
            </p>
            <p className="mb-4 text-center text-sm text-zinc-500">
              Inserisci la nota corrispondente al pallino evidenziato
            </p>
            <TouchButton variant="neutral" onClick={handleReplay} className="mb-6">
              Riascolta
            </TouchButton>

            <div className="flex flex-wrap justify-center gap-6">
              {notes.map((n, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center ${i === currentPos ? "ring-2 ring-white ring-offset-2 ring-offset-[#141418]" : ""}`}
                >
                  <div
                    className="h-14 w-14 rounded-full"
                    style={{
                      backgroundColor: `rgb(${NOTE_COLORS[n % 12].join(",")})`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-6">
              {input.map((val, i) => (
                <span
                  key={i}
                  className={val === notes[i] % 12 ? "text-green-400" : "text-red-400"}
                >
                  {val !== null ? NOTE_NAMES_IT[val] : "—"}
                </span>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
