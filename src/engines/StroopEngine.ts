export class StroopEngine {
  private _seed: number | null = null;

  constructor(seed?: number) {
    this._seed = seed ?? null;
  }

  private random(): number {
    if (this._seed !== null) {
      const x = Math.sin(this._seed++) * 10000;
      return x - Math.floor(x);
    }
    return Math.random();
  }

  nextStimulus(): number {
    return Math.floor(this.random() * 12);
  }
}
