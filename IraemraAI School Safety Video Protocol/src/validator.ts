// OverrideValidator — authentication is NOT implemented in this demo.
import { FixedMath } from './fixedmath';
import type { FixedN, TickCount } from './fixedmath';
import { RosettaStone } from './rosettastone';
import type { PublicKey } from './rosettastone';
import { PersistentStore } from './persistence';

export class RateLimiter {
  private globalAttempts: TickCount[] = [];
  private readonly GLOBAL_MAX = 50;
  private readonly WINDOW = 60_000_000n; // microseconds: 60 seconds
  private lockdownUntil: TickCount = 0n;

  constructor(private fixed: typeof FixedMath) {}

  isAllowed(): boolean {
    const now = this.fixed.now();
    if (now < this.lockdownUntil) return false;
    this.globalAttempts = this.globalAttempts.filter(t => now - t < this.WINDOW);
    if (this.globalAttempts.length >= this.GLOBAL_MAX) {
      this.lockdownUntil = now + 600_000_000n; // 10 minutes
      console.error('GLOBAL LOCKDOWN (DEMO)');
      return false;
    }
    this.globalAttempts.push(now);
    return true;
  }
}

export class OverrideValidator {
  private readonly rosetta: RosettaStone;
  private readonly authorizedKeys: Set<string>;

  constructor(store: PersistentStore, authorizedKeys: PublicKey[]) {
    this.rosetta = new RosettaStone(store);
    this.authorizedKeys = new Set(authorizedKeys.map(key => this.toHex(key)));
  }

  async init(): Promise<void> { await this.rosetta.init(); }

  isAuthorizedKey(key: PublicKey): boolean {
    return this.authorizedKeys.has(this.toHex(key));
  }

  // A complete override authorization implementation is absent upstream.
  // Do not silently accept or issue overrides until policy, signatures,
  // replay protection and independent verification are implemented and tested.
  attemptOverride(_nonce: FixedN): never {
    throw new Error('Override authorization NOT IMPLEMENTED: prototype only');
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
}
