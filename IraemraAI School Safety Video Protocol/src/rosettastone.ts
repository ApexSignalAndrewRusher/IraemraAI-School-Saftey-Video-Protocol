// rosettastone.ts - Crypto Bridge + Hashing (Final Hardened)
import { FixedMath } from './fixedmath';
import { PersistentStore } from './persistence';

type Hash32 = Uint8Array;

export class RosettaStone {
  private installSalt: Uint8Array | null = null;
  private store: PersistentStore;

  constructor(store: PersistentStore) {
    this.store = store;
  }

  async init(): Promise<void> {
    // Secure context guard
    if (typeof crypto === 'undefined' || !crypto.getRandomValues || !crypto.subtle) {
      throw new Error('CRITICAL: Insecure cryptographic context');
    }

    let salt = await this.store.get('system', 'install_salt');
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(32));
      await this.store.set('system', 'install_salt', Array.from(salt));
    } else if (Array.isArray(salt)) {
      salt = new Uint8Array(salt);
    }
    this.installSalt = salt;
  }

  async hashBytes(data: Uint8Array): Promise<Hash32> {
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(buffer);
  }

  async saltHash(key: PublicKey): Promise<Hash32> {
    if (!this.installSalt) throw new Error('RosettaStone not initialized');
    const paddedKey = new Uint8Array(64).fill(0);
    paddedKey.set(key.slice(0, 64));
    const combined = new Uint8Array(this.installSalt.length + 64);
    combined.set(this.installSalt);
    combined.set(paddedKey, this.installSalt.length);
    return await this.hashBytes(combined);
  }

  bigIntToBytes(value: bigint, length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    for (let i = length - 1; i >= 0; i--) {
      bytes[i] = Number(value & 0xffn);
      value >>= 8n;
    }
    return bytes;
  }

  createOverrideHash(token: any): Hash32 {
    const fields = [
      new TextEncoder().encode(token.target_zone),
      token.actor_public_key,
      this.bigIntToBytes(token.timestamp, 8),
      this.bigIntToBytes(token.nonce, 8),
      token.justification_hash,
      token.system_state_hash,
    ];

    const prefixed = fields.flatMap(field => {
      const len = field.length;
      if (len > 65535) throw new Error('Field too long');
      return [(len >> 8) & 0xff, len & 0xff, ...field];
    });

    return this.hashBytesSync(new Uint8Array(prefixed));
  }

  private hashBytesSync(data: Uint8Array): Hash32 {
    const buffer = crypto.subtle.digestSync('SHA-256', data);
    return new Uint8Array(buffer as ArrayBuffer);
  }
}