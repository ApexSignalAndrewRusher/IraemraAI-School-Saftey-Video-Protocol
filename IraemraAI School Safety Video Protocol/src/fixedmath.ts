// fixedmath.ts - BigInt core with explicitly numeric time/score input boundaries
export type TickCount = bigint;
export type FixedN = bigint;

export class FixedMath {
  static now(): TickCount {
    // performance.now() is milliseconds; multiply by 1,000 for microseconds.
    // The previous 1,000,000 conversion made rate windows 1,000x too short.
    return BigInt(Math.floor(performance.now() * 1_000));
  }

  static fromNumber(x: number): FixedN {
    if (!Number.isFinite(x)) throw new RangeError('FixedMath input must be finite');
    return BigInt(Math.floor(x * 1_000_000)); // Explicit numeric boundary
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