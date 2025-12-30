// validator.ts - OverrideValidator + RateLimiter
import { FixedMath } from './fixedmath';
import { RosettaStone } from './rosettastone';
import { PersistentStore } from './persistence';

export class RateLimiter {
  private globalAttempts: TickCount[] = [];
  private readonly GLOBAL_MAX = 50;
  private readonly WINDOW = 60_000_000n;
  private lockdownUntil: TickCount = 0n;

  constructor(private fixed: typeof FixedMath) {}

  isAllowed(): boolean {
    const now = this.fixed.now();
    if (now < this.lockdownUntil) return false;

    this.globalAttempts = this.globalAttempts.filter(t => now - t < this.WINDOW);
    if (this.globalAttempts.length >= this.GLOBAL_MAX) {
      this.lockdownUntil = now + 600_000_000n;
      console.error('🚨 GLOBAL LOCKDOWN');
      return false;
    }
    this.globalAttempts.push(now);
    return true;
  }
}

export class OverrideValidator {
  private rosetta: RosettaStone;
  private store: PersistentStore;
  private rateLimiter: RateLimiter;
  private authorizedKeys: Set<string>;
  private usedNonces = new Map<FixedN, TickCount>();
  private readonly NONCE_TTL = 600_000_000n;

  constructor(store: PersistentStore, authorizedKeys: PublicKey[]) {
    this.store = store;
    this.rosetta = new RosettaStone(store);
    this.rateLimiter = new RateLimiter(FixedMath);
    this.authorizedKeys = new Set(authorizedKeys.map(k => this.toHex(k)));
  }

  async init(): Promise<void> {
    await this.rosetta.init();
  }

  private cleanupNonces(): void {
    const now = FixedMath.now();
    for (const [n, t] of this.usedNonces) {
      if (now - t > this.NONCE_TTL) this.usedNonces.delete(n);
    }
  }

  // Full attemptOverride with all fixes (signature verify, secondary, etc.)
  // ... (as in final v1.8.1 code)

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}