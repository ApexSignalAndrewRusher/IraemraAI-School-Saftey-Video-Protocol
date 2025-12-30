// fixedmath.ts - Core Deterministic Math (No Floats)
export type TickCount = bigint;
export type FixedN = bigint;

export class FixedMath {
  static now(): TickCount {
    return BigInt(Math.floor(performance.now() * 1_000_000));
  }

  static fromNumber(x: number): FixedN {
    return BigInt(Math.floor(x * 1_000_000)); // µs scale for time/score
  }

  static add(a: FixedN, b: FixedN): FixedN { return a + b; }
  static sub(a: FixedN, b: FixedN): FixedN { return a - b; }
  static gt(a: FixedN, b: FixedN): boolean { return a > b; }
  static geq(a: FixedN, b: FixedN): boolean { return a >= b; }
  static lt(a: FixedN, b: FixedN): boolean { return a < b; }

  // For VCH scores (0-1 range)
  static min(a: FixedN, b: FixedN): FixedN {
    return a < b ? a : b;
  }

  static computePsi(ol: FixedN, oe: FixedN, oh: FixedN): FixedN {
    return this.min(ol, this.min(oe, oh));
  }
}