import { IraemraProtocol } from './iraemra';
import { equalDemoBytes } from './replay';

const log = document.getElementById('log');
const btn = document.getElementById('demo-btn') as HTMLButtonElement | null;
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement | null;
if (!log || !btn || !replayBtn) throw new Error('Missing demo elements');

const protocol = new IraemraProtocol();
let initialized = false;
let lastNonce: Uint8Array | null = null;
let lastDigest: Uint8Array | null = null;
const hexPrefix = (bytes: Uint8Array): string =>
  Array.from(bytes.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');

async function init() {
  if (!initialized) {
    await protocol.init();
    initialized = true;
  }
}

btn.onclick = async () => {
  btn.disabled = true;
  replayBtn.disabled = true;
  lastNonce = null;
  lastDigest = null;
  log.textContent = 'Initializing prototype...\n';
  try {
    await init();
    log.textContent += 'Generating random simulated nonce (not an authorized override)...\n';
    const epo = await protocol.demoEmergencyOverride();
    const pir = await protocol.demoClosePIR(epo);
    lastNonce = new Uint8Array(epo.demo_nonce); // Own the replay input.
    lastDigest = new Uint8Array(pir.demo_digest);
    log.textContent += 'Demo nonce prefix: ' + hexPrefix(lastNonce) + '...\n';
    log.textContent += 'SHA-256 of demo nonce: ' + hexPrefix(lastDigest) + '...\n';
    log.textContent += '\n=== SIMULATION COMPLETE ===\n';
    log.textContent += 'No safety response, video evidence, signed override, Merkle tree, admissibility or chain of custody was created.\n';
    log.textContent += 'Replay is available for the same generated nonce; it verifies only repeatability.\n';
    replayBtn.disabled = false;
  } catch (error) {
    log.textContent += '\nDEMO FAILED: ' +
      (error instanceof Error ? error.message : 'Unknown error');
  } finally {
    btn.disabled = false;
  }
};

replayBtn.onclick = async () => {
  if (!lastNonce || !lastDigest) return;
  btn.disabled = true;
  replayBtn.disabled = true;
  try {
    const replay = await protocol.demoClosePIR({ demo_nonce: lastNonce });
    const same = equalDemoBytes(replay.demo_digest, lastDigest);
    log.textContent += same
      ? 'REPLAY PASS: Same nonce gives identical SHA-256 output.\n'
      : 'REPLAY FAIL: Digest differs for same nonce.\n';
    log.textContent += 'This is input/output replay only, not evidence verification or chain of custody.\n';
  } catch (error) {
    log.textContent += 'REPLAY FAILED: ' +
      (error instanceof Error ? error.message : 'Unknown error') + '\n';
  } finally {
    btn.disabled = false;
    replayBtn.disabled = false;
  }
};
