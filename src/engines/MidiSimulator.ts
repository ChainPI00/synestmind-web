import type { NoteEvent, PedalEvent } from "@/lib/types";

export class MidiSimulatorEngine {
  events: NoteEvent[];
  pedalEvents: PedalEvent[];
  currentIndex: number;
  currentPedalIdx: number;
  activeNotes: Map<number, { end: number; velocity: number }>;
  pedalActive: boolean;
  pedalSustainedNotes: Set<number>;

  constructor(events: NoteEvent[], pedalEvents: PedalEvent[] = []) {
    this.events = events;
    this.pedalEvents = pedalEvents;
    this.currentIndex = 0;
    this.currentPedalIdx = 0;
    this.activeNotes = new Map();
    this.pedalActive = false;
    this.pedalSustainedNotes = new Set();
  }

  reset(): void {
    this.currentIndex = 0;
    this.currentPedalIdx = 0;
    this.activeNotes.clear();
    this.pedalActive = false;
    this.pedalSustainedNotes.clear();
  }

  private updatePedalState(currentTime: number): void {
    while (
      this.currentPedalIdx < this.pedalEvents.length &&
      currentTime + 1e-6 >= this.pedalEvents[this.currentPedalIdx].time
    ) {
      const ev = this.pedalEvents[this.currentPedalIdx];
      const newState = ev.value > 0;
      if (this.pedalActive && !newState) {
        this.pedalSustainedNotes.clear();
      }
      this.pedalActive = newState;
      this.currentPedalIdx += 1;
    }
  }

  getNextNotes(currentTime: number): [Array<[number, number]>, Array<[number, number]>] {
    const notesToPlay: Array<[number, number]> = [];
    const notesToRelease: Array<[number, number]> = [];

    this.updatePedalState(currentTime);

    const expired: number[] = [];
    this.activeNotes.forEach((val, p) => {
      if (currentTime >= val.end) expired.push(p);
    });
    for (const p of expired) {
      const val = this.activeNotes.get(p)!;
      this.activeNotes.delete(p);
      if (this.pedalActive) {
        this.pedalSustainedNotes.add(p);
      } else {
        notesToRelease.push([p, 0]);
      }
    }

    while (this.currentIndex < this.events.length) {
      const ev = this.events[this.currentIndex];
      if (currentTime + 1e-6 >= ev.time) {
        notesToPlay.push([ev.pitch, ev.velocity]);
        this.activeNotes.set(ev.pitch, {
          end: ev.time + ev.duration,
          velocity: ev.velocity,
        });
        this.pedalSustainedNotes.delete(ev.pitch);
        this.currentIndex += 1;
      } else {
        break;
      }
    }

    return [notesToPlay, notesToRelease];
  }

  getActiveNotes(): number[] {
    const active = new Set(this.activeNotes.keys());
    if (this.pedalActive) {
      this.pedalSustainedNotes.forEach((p) => active.add(p));
    }
    return Array.from(active);
  }

  getPressedNotes(): number[] {
    return Array.from(this.activeNotes.keys());
  }

  isPedalActive(): boolean {
    return this.pedalActive;
  }

  isFinished(): boolean {
    return (
      this.currentIndex >= this.events.length && this.activeNotes.size === 0
    );
  }

  getTotalNotes(): number {
    return this.events.length;
  }

  getNextNoteTime(): number | null {
    if (this.currentIndex < this.events.length) {
      return this.events[this.currentIndex].time;
    }
    return null;
  }
}

const PITCH_MIN = 36;
const PITCH_MAX = 84;

export interface ParsedMidi {
  events: NoteEvent[];
  pedalEvents: PedalEvent[];
}

/** Parse a @tonejs/midi Midi object into events and pedal events */
export function parseMidiToSimulator(midi: {
  tracks: Array<{
    notes: Array<{ time: number; duration: number; midi: number; velocity: number }>;
    controlChanges?: Record<number, Array<{ time: number; value: number }>>;
  }>;
}): ParsedMidi {
  const events: NoteEvent[] = [];
  const pedalEvents: PedalEvent[] = [];
  const t0Ref = { current: 0, set: false };

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      if (note.midi >= PITCH_MIN && note.midi <= PITCH_MAX) {
        const time = note.time;
        if (!t0Ref.set) {
          t0Ref.current = time;
          t0Ref.set = true;
        }
        events.push({
          pitch: note.midi,
          time,
          duration: Math.max(0.1, note.duration),
          velocity: Math.round(note.velocity * 127) || 64,
        });
      }
    }
    const cc = track.controlChanges as Record<number, Array<{ time: number; value: number }>> | undefined;
    if (cc && cc[64]) {
      for (const ev of cc[64]) {
        pedalEvents.push({
          time: ev.time,
          value: ev.value >= 64 ? 1 : 0,
        });
      }
    }
  }

  events.sort((a, b) => a.time - b.time);
  pedalEvents.sort((a, b) => a.time - b.time);

  const t0 = events.length ? events[0].time : 0;
  const normalizedEvents = events.map((e) => ({
    ...e,
    time: e.time - t0,
  }));
  const normalizedPedal = pedalEvents.map((e) => ({
    ...e,
    time: e.time - t0,
  }));

  return { events: normalizedEvents, pedalEvents: normalizedPedal };
}
