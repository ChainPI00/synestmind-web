/** RGB tuple [r, g, b] */
export type RGB = [number, number, number];

export type GameMode =
  | "menu"
  | "dual"
  | "stroop"
  | "stroop_menu"
  | "adv_stroop"
  | "inverse"
  | "simulation"
  | "duEnd"
  | "stEnd"
  | "advEnd"
  | "invEnd"
  | "simEnd";

export interface DualScore {
  datetime: string;
  n: number;
  overall: number;
  note_hits: number;
  note_misses: number;
  oct_hits: number;
  oct_misses: number;
}

export interface StroopScore {
  datetime: string;
  n: number;
  overall: number;
  stroop_hits: number;
  stroop_misses: number;
}

export interface AdvStroopScore {
  datetime: string;
  n: number;
  overall: number;
  adv_stroop_hits: number;
  adv_stroop_misses: number;
}

export interface InverseScore {
  datetime: string;
  overall: number;
  inverse_hits: number;
  inverse_misses: number;
}

export interface MidiNoteEvent {
  pitch: number;
  velocity: number;
  timestamp: number;
}

export interface NoteEvent {
  pitch: number;
  time: number;
  duration: number;
  velocity: number;
}

export interface PedalEvent {
  time: number;
  value: number;
}
