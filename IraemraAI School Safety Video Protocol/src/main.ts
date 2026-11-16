import { IraemraProtocol } from './iraemra';

const log = document.getElementById('log');
const btn = document.getElementById('demo-btn') as HTMLButtonElement | null;
if (!log || !btn) throw new Error('Missing demo elements');

const protocol = new IraemraProtocol();
let initialized = false;
const toHex = (bytes: Uint8Array): string => Array.from(bytes.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');

btn.onclick = async () => {
  btn.disabled = true;
  log.textContent = 'Initializing prototype...\n';
  try {
    if (!initialized) { await protocol.init(); initialized = true; }
    log.textContent += 'Generating random simulated EPO nonce (not an authorized override)...\n';
    const epo = await protocol.demoEmergencyOverride();
    log.textContent += 'Demo nonce prefix: ' + toHex(epo.demo_nonce) + '...\n';
    const pir = await protocol.demoClosePIR(epo);
    log.textContent += 'SHA-256 of demo nonce: ' + toHex(pir.demo_digest) + '...\n';
    log.textContent += '\n=== SIMULATION COMPLETE ===\n';
    log.textContent += 'No safety response, video evidence, signed override, Merkle tree, admissibility or chain of custody was created.';
  } catch (error) {
    log.textContent += '\nDEMO FAILED: ' + (error instanceof Error ? error.message : 'Unknown error');
  } finally {
    btn.disabled = false;
  }
};
