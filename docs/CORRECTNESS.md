# Correctness and safety-scope repair

This patch treats the repository as a **browser prototype**, not a school-safety system. Do not use it for actual emergency decisions, evidence preservation, child safety monitoring or custody certification.

## Problems addressed

- `FixedMath.now()` formerly multiplied `performance.now()` (milliseconds) by 1,000,000 rather than 1,000. This made the nominal 60-second rate window 60 milliseconds, and the 10-minute lockdown 0.6 seconds.
- `rosettastone.ts` used the nonexistent Web Crypto method `crypto.subtle.digestSync()`. It now exposes an asynchronous SHA-256 helper.
- The validator referenced undefined `TickCount`, `FixedN` and `PublicKey` and left an override implementation missing. Types are explicit, and attempting an actual override fails closed.
- The prior demo reported an admissible 98% score, a Merkle root and completed custody without computing or verifying any of these. The updated demo explicitly labels the generated random nonce and single SHA-256 digest as a simulation.
- The compliance timer is idempotent and catches asynchronous monitor failures.
- The build script now runs strict TypeScript checking before Vite; Node's built-in tests exercise time-unit conversion and representation claims.

## Reproduction

Run from the `IraemraAI School Safety Video Protocol` directory:

```sh
npm install --no-audit --no-fund --ignore-scripts
npm test
npm run build
```

The implementation still lacks verified authorization, signature checks, nonce persistence, Merkle-tree construction, event/video capture and real chain-of-custody procedures. These must not be inferred from the new code.

## Licensing note for the maintainer

The root README and `LICENSE.txt` contain placeholders in place of the full MIT text plus a separate determinism clause. **No licence changes are made in this patch.** Please clarify the intended licence and any additional requirements before encouraging redistribution or deployment.

## QSOL-IMC integration — finite, replayable demonstrations

The following adaptation uses methods rather than importing unrelated software:

- **OPT contract:** `QSOLKCB/OPT/AGENTS.md` asks for a named invariant and reference/conformance checks before optimisation. The replay invariant here is **the exact 32-byte nonce supplied to SHA-256**, with deterministic output comparison. The user can rerun the same session input without generating new random bytes.
- **VANILLAJS precedent:** `QSOLKCB/VANILLAJS/AGENTS.md` separates pure modules from browser/UI state and requires explicit test scope. `src/replay.ts` has no DOM or storage dependency and is tested directly by Node.
- **Not ported:** VANILLAJS's checked Q16.16 module is deliberately **not** imported because the existing app stores microsecond durations and six-decimal scores in `bigint`, a different representation. There is no sound equivalence justification for a Q16.16 substitution here.
- **No security inference:** SHA-256 repeatability demonstrates that the same bytes produce the same hash on the tested implementation; it does not authenticate sources, sign records, verify evidence, implement actual emergency handling or provide immutable custody.

The previous demo still has no production safety authorization. The new Replay button retains a transient in-memory nonce and digest only; no local storage or external service is used for replay.
