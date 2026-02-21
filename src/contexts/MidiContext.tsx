"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

export interface MidiContextValue {
  isSupported: boolean;
  isConnected: boolean;
  midiDeviceName: string | null;
  lastNoteOn: { pitch: number; velocity: number } | null;
  error: string | null;
  requestAccess: () => Promise<void>;
  subscribeNoteOn: (cb: (pitch: number, velocity: number) => void) => () => void;
  subscribeNoteOff: (cb: (pitch: number) => void) => () => void;
}

const MidiContext = createContext<MidiContextValue | null>(null);

interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((this: MIDIAccess, ev: Event) => void) | null;
}

interface MIDIInput {
  id: string;
  name: string;
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
}

interface MIDIMessageEvent {
  data: Uint8Array;
}

type NavWithMidi = Navigator & {
  requestMIDIAccess?: (o?: { sysex?: boolean }) => Promise<unknown>;
};

export function MidiProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(() =>
    typeof navigator !== "undefined" && "requestMIDIAccess" in navigator
  );
  const [isConnected, setIsConnected] = useState(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);
  const [lastNoteOn, setLastNoteOn] = useState<{
    pitch: number;
    velocity: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(
    typeof navigator !== "undefined" && "requestMIDIAccess" in navigator
      ? null
      : "Web MIDI non supportato in questo browser"
  );

  const noteOnSubs = useRef<Set<(pitch: number, velocity: number) => void>>(
    new Set()
  );
  const noteOffSubs = useRef<Set<(pitch: number) => void>>(new Set());
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const connectedRef = useRef(false);

  const subscribeNoteOn = useCallback(
    (cb: (pitch: number, velocity: number) => void) => {
      noteOnSubs.current.add(cb);
      return () => {
        noteOnSubs.current.delete(cb);
      };
    },
    []
  );

  const subscribeNoteOff = useCallback((cb: (pitch: number) => void) => {
    noteOffSubs.current.add(cb);
    return () => {
      noteOffSubs.current.delete(cb);
    };
  }, []);

  const handleMessage = useCallback((event: MIDIMessageEvent) => {
    const [status, data1, data2] = event.data;
    if (status === undefined || data1 === undefined) return;

    const type = status & 0xf0;

    if (type === NOTE_ON) {
      const velocity = data2 ?? 0;
      if (velocity > 0) {
        setLastNoteOn({ pitch: data1, velocity });
        noteOnSubs.current.forEach((cb) => cb(data1, velocity));
      } else {
        noteOffSubs.current.forEach((cb) => cb(data1));
      }
    } else if (type === NOTE_OFF) {
      noteOffSubs.current.forEach((cb) => cb(data1));
    }
  }, []);

  const bindInputs = useCallback(
    (access: MIDIAccess) => {
      midiAccessRef.current = access;
      const inputs = access.inputs;
      if (inputs.size === 0) {
        setIsConnected(false);
        connectedRef.current = false;
        setMidiDeviceName(null);
        setError("Nessun dispositivo MIDI trovato. Collega il piano e riprova.");
        return;
      }
      const firstInput = inputs.values().next().value as MIDIInput;
      if (!firstInput) return;

      firstInput.onmidimessage = (ev: MIDIMessageEvent) => handleMessage(ev);
      setIsConnected(true);
      connectedRef.current = true;
      setMidiDeviceName(firstInput.name);
      setError(null);
    },
    [handleMessage]
  );

  const requestAccess = useCallback(async () => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as NavWithMidi;
    if (!nav.requestMIDIAccess) {
      setIsSupported(false);
      setError("Web MIDI non supportato in questo browser");
      return;
    }

    setError(null);

    try {
      const access = (await nav.requestMIDIAccess.call(navigator, {
        sysex: false,
      })) as unknown as MIDIAccess;

      access.onstatechange = () => {
        if (!midiAccessRef.current) return;
        const inputs = midiAccessRef.current.inputs;
        if (inputs.size === 0) {
          setIsConnected(false);
          connectedRef.current = false;
          setMidiDeviceName(null);
          setError("Dispositivo MIDI disconnesso. Tocca per riconnettere.");
        } else {
          const firstInput = inputs.values().next().value as MIDIInput;
          if (firstInput) {
            firstInput.onmidimessage = (ev: MIDIMessageEvent) =>
              handleMessage(ev);
            setIsConnected(true);
            connectedRef.current = true;
            setMidiDeviceName(firstInput.name);
            setError(null);
          }
        }
      };

      bindInputs(access);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Impossibile accedere al MIDI";
      setError(msg);
    }
  }, [handleMessage, bindInputs]);

  const value: MidiContextValue = {
    isSupported,
    isConnected,
    midiDeviceName,
    lastNoteOn,
    error,
    requestAccess,
    subscribeNoteOn,
    subscribeNoteOff,
  };

  return (
    <MidiContext.Provider value={value}>{children}</MidiContext.Provider>
  );
}

export function useMidiContext(): MidiContextValue {
  const ctx = useContext(MidiContext);
  if (!ctx) {
    throw new Error("useMidiContext must be used within MidiProvider");
  }
  return ctx;
}
