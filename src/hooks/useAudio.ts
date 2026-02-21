"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";

const PITCH_MIN = 36;
const PITCH_MAX = 84;
const DEFAULT_RELEASE = 0.4;

export interface UseAudioReturn {
  playNote: (pitch: number, velocity?: number, duration?: number) => void;
  stopNote: (pitch: number) => void;
  setVolume: (value: number) => void;
  volume: number;
  isReady: boolean;
  resume: () => Promise<void>;
}

export function useAudio(): UseAudioReturn {
  const [volume, setVolumeState] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const polyRef = useRef<Tone.PolySynth | null>(null);
  const volumeRef = useRef<Tone.Volume | null>(null);

  const resume = useCallback(async () => {
    if (typeof window === "undefined") return;
    await Tone.start();
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vol = new Tone.Volume(0).toDestination();
    volumeRef.current = vol;

    const poly = new Tone.PolySynth({
      maxPolyphony: 16,
      voice: Tone.Synth,
      options: {
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.01,
          decay: 0.05,
          sustain: 0.8,
          release: DEFAULT_RELEASE,
        },
      },
    }).connect(vol);

    polyRef.current = poly;
    setIsReady(true);

    return () => {
      poly.dispose();
      vol.dispose();
      polyRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  const setVolume = useCallback((value: number) => {
    const v = Math.max(0, Math.min(1, value));
    setVolumeState(v);
    if (volumeRef.current) {
      volumeRef.current.volume.value = v <= 0 ? -100 : Math.log10(v) * 20;
    }
  }, []);

  const playNote = useCallback(
    (pitch: number, velocity = 127, duration?: number) => {
      if (pitch < PITCH_MIN || pitch > PITCH_MAX) return;
      const poly = polyRef.current;
      if (!poly) return;

      const freq = Tone.Midi(pitch).toFrequency();
      const vel = velocity / 127;
      const rel = duration ?? DEFAULT_RELEASE;
      const now = Tone.now();
      poly.triggerAttack(freq, now, vel);
      poly.triggerRelease(freq, now + rel);
    },
    []
  );

  const stopNote = useCallback((pitch: number) => {
    const poly = polyRef.current;
    if (!poly) return;
    const freq = Tone.Midi(pitch).toFrequency();
    poly.triggerRelease(freq);
  }, []);

  return {
    playNote,
    stopNote,
    setVolume,
    volume,
    isReady,
    resume,
  };
}
