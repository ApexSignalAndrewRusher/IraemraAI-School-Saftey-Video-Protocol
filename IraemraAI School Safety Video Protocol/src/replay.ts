// SPDX-License-Identifier: MIT
// Pure byte-level demo replay helpers (no DOM, no storage, no claims of custody).
export const DEMO_NONCE_BYTES = 32;

export function copyDemoNonce(input: Uint8Array): Uint8Array {
  if (!(input instanceof Uint8Array) || input.byteLength !== DEMO_NONCE_BYTES) {
    throw new RangeError('Demo nonce must be exactly 32 bytes');
  }
  return new Uint8Array(input); // Preserve identity even if caller mutates input.
}

export async function digestDemoNonce(input: Uint8Array): Promise<Uint8Array> {
  const copy = copyDemoNonce(input);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return new Uint8Array(digest);
}

// Equality is for replay comparison only; no cryptographic timing claim.
export function equalDemoBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) ||
      a.byteLength !== b.byteLength) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
