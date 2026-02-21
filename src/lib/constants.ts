import type { RGB } from "./types";

/** Colori per le 12 note cromatiche (Do..Si) - stesso ordine dell'originale game.py */
export const NOTE_COLORS: RGB[] = [
  [255, 0, 0],      // Do - Rosso
  [255, 69, 0],     // Do# - Arancione scuro
  [255, 165, 0],    // Re - Arancione
  [255, 215, 0],    // Re# - Oro
  [255, 255, 0],    // Mi - Giallo
  [0, 255, 0],      // Fa - Verde
  [0, 128, 128],    // Fa# - Teal
  [0, 0, 255],      // Sol - Blu
  [0, 0, 139],     // Sol# - Blu scuro
  [75, 0, 130],    // La - Indaco
  [148, 0, 211],   // La# - Viola
  [255, 20, 147],  // Si - Rosa
];

export const NOTE_NAMES_IT = [
  "Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si",
];

export const NOTE_NAMES_EN = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

/** Limiti di gioco */
export const NOTE_LIMIT = 80;
export const STROOP_LIMIT = 80;
export const INVERSE_LIMIT = 40;
export const ADV_STROOP_LIMIT = 40;
export const ADV_STROOP_NOTES = 3;
export const INTERVAL = 1.5;
export const STROOP_RESPONSE_TIMEOUT = 1.5;

/** Pitch range (MIDI) usato nel gioco */
export const PITCH_MIN = 36;
export const PITCH_MAX = 84;

/** Chiavi localStorage */
export const STORAGE_KEYS = {
  N_BACK_LEVEL: "synestmind_nback_level",
  SCORES_DUAL: "synestmind_scores_dual",
  SCORES_STROOP: "synestmind_scores_stroop",
  SCORES_ADV_STROOP: "synestmind_scores_adv_stroop",
  SCORES_INVERSE: "synestmind_scores_inverse",
} as const;

/** File MIDI di default per simulazione */
export const DEFAULT_MIDI_FILE = "/midi/interstellar.mid";

/** Restituisce il colore per un pitch (nota cromatica 0-11) */
export function gridColor(pitch: number): RGB {
  return NOTE_COLORS[pitch % 12];
}
