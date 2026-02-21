import { STORAGE_KEYS } from "./constants";
import type {
  DualScore,
  StroopScore,
  AdvStroopScore,
  InverseScore,
} from "./types";

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function loadLevel(defaultVal: number = 2): number {
  const n = getItem<number>(STORAGE_KEYS.N_BACK_LEVEL, defaultVal);
  return Math.max(2, Math.floor(n));
}

export function saveLevel(n: number): void {
  setItem(STORAGE_KEYS.N_BACK_LEVEL, n);
}

export function saveDualScore(
  n: number,
  acc: number,
  s: {
    note_hits: number;
    note_misses: number;
    oct_hits: number;
    oct_misses: number;
  }
): void {
  const record: DualScore = {
    datetime: new Date().toISOString().slice(0, 19).replace("T", " "),
    n,
    overall: Math.round(acc * 100) / 100,
    note_hits: s.note_hits,
    note_misses: s.note_misses,
    oct_hits: s.oct_hits,
    oct_misses: s.oct_misses,
  };
  const list = getItem<DualScore[]>(STORAGE_KEYS.SCORES_DUAL, []);
  list.push(record);
  setItem(STORAGE_KEYS.SCORES_DUAL, list);
}

export function lastTwoDual(n: number): number[] {
  const list = getItem<DualScore[]>(STORAGE_KEYS.SCORES_DUAL, []);
  const accs = list.filter((r) => r.n === n).map((r) => r.overall);
  return accs.slice(-2);
}

export function saveStroopScore(
  n: number,
  acc: number,
  s: { stroop_hits: number; stroop_misses: number }
): void {
  const record: StroopScore = {
    datetime: new Date().toISOString().slice(0, 19).replace("T", " "),
    n,
    overall: Math.round(acc * 100) / 100,
    stroop_hits: s.stroop_hits,
    stroop_misses: s.stroop_misses,
  };
  const list = getItem<StroopScore[]>(STORAGE_KEYS.SCORES_STROOP, []);
  list.push(record);
  setItem(STORAGE_KEYS.SCORES_STROOP, list);
}

export function lastTwoStroop(n: number): number[] {
  const list = getItem<StroopScore[]>(STORAGE_KEYS.SCORES_STROOP, []);
  const accs = list.filter((r) => r.n === n).map((r) => r.overall);
  return accs.slice(-2);
}

export function saveAdvStroopScore(
  n: number,
  acc: number,
  s: { adv_stroop_hits: number; adv_stroop_misses: number }
): void {
  const record: AdvStroopScore = {
    datetime: new Date().toISOString().slice(0, 19).replace("T", " "),
    n,
    overall: Math.round(acc * 100) / 100,
    adv_stroop_hits: s.adv_stroop_hits,
    adv_stroop_misses: s.adv_stroop_misses,
  };
  const list = getItem<AdvStroopScore[]>(STORAGE_KEYS.SCORES_ADV_STROOP, []);
  list.push(record);
  setItem(STORAGE_KEYS.SCORES_ADV_STROOP, list);
}

export function saveInverseScore(
  acc: number,
  s: { inverse_hits: number; inverse_misses: number }
): void {
  const record: InverseScore = {
    datetime: new Date().toISOString().slice(0, 19).replace("T", " "),
    overall: Math.round(acc * 100) / 100,
    inverse_hits: s.inverse_hits,
    inverse_misses: s.inverse_misses,
  };
  const list = getItem<InverseScore[]>(STORAGE_KEYS.SCORES_INVERSE, []);
  list.push(record);
  setItem(STORAGE_KEYS.SCORES_INVERSE, list);
}
