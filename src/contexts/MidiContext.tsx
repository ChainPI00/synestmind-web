"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export function MidiProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);
  const [lastNoteOn, setLastNoteOn] = useState<{
    pitch: number;
    velocity: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const noteOnSubs = useRef<Set<(pitch: number, velocity: number) => void>>(
    new Set()
  );
  const noteOffSubs = useRef<Set<(pitch: number) => void>>(new Set());

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

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
    setIsSupported(!!supported);

    if (!supported) {
      setError("Web MIDI non supportato in questo browser");
      return;
    }

    let midiAccess: MIDIAccess | null = null;

    const connect = (access: MIDIAccess) => {
      midiAccess = access;
      const inputs = access.inputs;
      if (inputs.size === 0) {
        setIsConnected(false);
        setMidiDeviceName(null);
        setError("Nessun dispositivo MIDI. Collega il piano.");
        return;
      }
      const firstInput = inputs.values().next().value as MIDIInput;
      if (!firstInput) return;

      firstInput.onmidimessage = (ev: MIDIMessageEvent) => handleMessage(ev);
      setIsConnected(true);
      setMidiDeviceName(firstInput.name);
      setError(null);
    };

    const onStateChange = () => {
      if (!midiAccess) return;
      const inputs = midiAccess.inputs;
      if (inputs.size === 0) {
        setIsConnected(false);
        setMidiDeviceName(null);
        setError("Dispositivo MIDI disconnesso");
      } else {
        const firstInput = inputs.values().next().value as MIDIInput;
        if (firstInput) {
          firstInput.onmidimessage = (ev: MIDIMessageEvent) =>
            handleMessage(ev);
          setIsConnected(true);
          setMidiDeviceName(firstInput.name);
          setError(null);
        }
      }
    };

    const nav = navigator as Navigator & { requestMIDIAccess?: (o?: { sysex?: boolean }) => Promise<MIDIAccess> };
    if (nav.requestMIDIAccess) {
      nav.requestMIDIAccess.call(navigator, { sysex: false })
        .then((access) => {
          (access as unknown as MIDIAccess).onstatechange = onStateChange;
          connect(access as unknown as MIDIAccess);
        })
        .catch((err) => {
          setError(err?.message ?? "Impossibile accedere al MIDI");
        });
    }

    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [handleMessage]);

  const value: MidiContextValue = {
    isSupported,
    isConnected,
    midiDeviceName,
    lastNoteOn,
    error,
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
