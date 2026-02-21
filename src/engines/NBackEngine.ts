import { PITCH_MIN, PITCH_MAX } from "@/lib/constants";

export interface HistoryEntry {
  pitch: number;
  time: number;
}

export class NBackEngine {
  private n: number;
  private pitchMin: number;
  private pitchMax: number;
  private history: HistoryEntry[];
  private _seed: number | null = null;

  constructor(
    n: number = 2,
    pitchMin: number = PITCH_MIN,
    pitchMax: number = PITCH_MAX,
    seed?: number
  ) {
    this.n = n;
    this.pitchMin = pitchMin;
    this.pitchMax = pitchMax;
    this.history = [];
    this._seed = seed ?? null;
  }

  private random(): number {
    if (this._seed !== null) {
      const x = Math.sin(this._seed++) * 10000;
      return x - Math.floor(x);
    }
    return Math.random();
  }

  reset(): void {
    this.history = [];
  }

  nextStimulus(): number {
    const range = this.pitchMax - this.pitchMin + 1;
    const p =
      this.pitchMin + Math.floor(this.random() * range);
    this.history.push({ pitch: p, time: Date.now() / 1000 });
    if (this.history.length > this.n + 1) {
      this.history.shift();
    }
    return p;
  }

  evaluate(cur: number): [boolean, boolean] {
    if (this.history.length <= this.n) return [false, false];
    const past = this.history[this.history.length - this.n - 1].pitch;
    const noteMatch = cur % 12 === past % 12;
    const octMatch = Math.floor(cur / 12) === Math.floor(past / 12);
    return [noteMatch, octMatch];
  }
}
