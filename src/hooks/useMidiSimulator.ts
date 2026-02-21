"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Midi } from "@tonejs/midi";
import {
  MidiSimulatorEngine,
  parseMidiToSimulator,
  type ParsedMidi,
} from "@/engines/MidiSimulator";
import { DEFAULT_MIDI_FILE } from "@/lib/constants";

export function useMidiSimulator(midiUrl: string = DEFAULT_MIDI_FILE) {
  const [simulator, setSimulator] = useState<MidiSimulatorEngine | null>(null);
  const [pressedNotes, setPressedNotes] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const startTimeRef = useRef(0);
  const totalNotesRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const midi = await Midi.fromUrl(midiUrl);
      const { events, pedalEvents } = parseMidiToSimulator(midi);
      const sim = new MidiSimulatorEngine(events, pedalEvents);
      totalNotesRef.current = sim.getTotalNotes();
      setSimulator(sim);
      setPressedNotes([]);
      setProgress(0);
      setIsFinished(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento MIDI");
      setSimulator(null);
    } finally {
      setLoading(false);
    }
  }, [midiUrl]);

  const reset = useCallback(() => {
    if (simulator) {
      simulator.reset();
      startTimeRef.current = Date.now() / 1000;
      setPressedNotes([]);
      setProgress(0);
      setIsFinished(false);
    }
  }, [simulator]);

  return {
    simulator,
    pressedNotes,
    progress,
    isFinished,
    error,
    loading,
    load,
    reset,
    totalNotes: totalNotesRef.current,
    startTimeRef,
    setPressedNotes,
    setProgress,
    setIsFinished,
  };
}
