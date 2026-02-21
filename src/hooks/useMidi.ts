"use client";

import { useCallback, useEffect, useState } from "react";

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

export interface MidiState {
  isSupported: boolean;
  isConnected: boolean;
  midiDeviceName: string | null;
  lastNoteOn: { pitch: number; velocity: number } | null;
  error: string | null;
}

export interface UseMidiOptions {
  onNoteOn?: (pitch: number, velocity: number) => void;
  onNoteOff?: (pitch: number) => void;
}

interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  outputs: Map<string, MIDIOutput>;
  onstatechange: ((this: MIDIAccess, ev: Event) => void) | null;
}

interface MIDIInput {
  id: string;
  name: string;
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
  state: string;
}

interface MIDIOutput {
  id: string;
  name: string;
  state: string;
}

interface MIDIMessageEvent {
  data: Uint8Array;
}

export function useMidi(options: UseMidiOptions = {}): MidiState {
  const { onNoteOn, onNoteOff } = options;
  const [state, setState] = useState<MidiState>({
    isSupported: false,
    isConnected: false,
    midiDeviceName: null,
    lastNoteOn: null,
    error: null,
  });

  const handleMessage = useCallback(
    (event: MIDIMessageEvent, deviceName: string) => {
      const [status, data1, data2] = event.data;
      if (status === undefined || data1 === undefined) return;

      const channel = status & 0x0f;
      const type = status & 0xf0;

      if (type === NOTE_ON) {
        const velocity = data2 ?? 0;
        if (velocity > 0) {
          setState((prev) => ({
            ...prev,
            lastNoteOn: { pitch: data1, velocity },
          }));
          onNoteOn?.(data1, velocity);
        } else {
          onNoteOff?.(data1);
        }
      } else if (type === NOTE_OFF) {
        onNoteOff?.(data1);
      }
    },
    [onNoteOn, onNoteOff]
  );

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
    setState((prev) => ({ ...prev, isSupported: !!supported }));

    if (!supported) {
      setState((prev) => ({
        ...prev,
        error: "Web MIDI non supportato in questo browser",
      }));
      return;
    }

    let midiAccess: MIDIAccess | null = null;

    const connect = (access: MIDIAccess) => {
      midiAccess = access;
      const inputs = access.inputs;
      if (inputs.size === 0) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          midiDeviceName: null,
          error: "Nessun dispositivo MIDI trovato. Collega il piano.",
        }));
        return;
      }
      // Use first input (or we could let user choose)
      const firstInput = inputs.values().next().value as MIDIInput;
      if (!firstInput) return;

      firstInput.onmidimessage = (ev: MIDIMessageEvent) =>
        handleMessage(ev, firstInput.name);

      setState((prev) => ({
        ...prev,
        isConnected: true,
        midiDeviceName: firstInput.name,
        error: null,
      }));
    };

    const req = (navigator as Navigator & { requestMIDIAccess?: (o?: { sysex?: boolean }) => Promise<MIDIAccess> })
      .requestMIDIAccess;
    const onStateChange = () => {
      if (!midiAccess) return;
      const inputs = midiAccess.inputs;
      if (inputs.size === 0) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          midiDeviceName: null,
          error: "Dispositivo MIDI disconnesso",
        }));
      } else {
        const firstInput = inputs.values().next().value as MIDIInput;
        if (firstInput) {
          firstInput.onmidimessage = (ev: MIDIMessageEvent) =>
            handleMessage(ev, firstInput.name);
          setState((prev) => ({
            ...prev,
            isConnected: true,
            midiDeviceName: firstInput.name,
            error: null,
          }));
        }
      }
    };

    if (req) {
      req({ sysex: false })
        .then((access) => {
          (access as unknown as MIDIAccess).onstatechange = onStateChange;
          connect(access as unknown as MIDIAccess);
        })
        .catch((err) => {
          setState((prev) => ({
            ...prev,
            error: err?.message ?? "Impossibile accedere al MIDI",
          }));
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

  return state;
}
