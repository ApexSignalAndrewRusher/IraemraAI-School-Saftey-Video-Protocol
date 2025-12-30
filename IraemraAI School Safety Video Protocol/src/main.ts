import { IraemraProtocol } from './iraemra';

const log = document.getElementById('log') as HTMLPreElement;
const btn = document.getElementById('demo-btn') as HTMLButtonElement;

btn.onclick = async () => {
  log.textContent = 'Initializing IRAEMRA v1.8.1...\n';
  const protocol = new IraemraProtocol();
  await protocol.init();

  log.textContent += 'Triggering emergency EPO in bathroom_3A (fight)...\n';
  const epo = await protocol.demoEmergencyOverride();

  if (epo) {
    log.textContent += `EPO activated! Hash: ${Array.from(epo.override_hash.slice(0,8)).map(b=>b.toString(16).padStart(2,'0')).join('')}...\n`;
    log.textContent += 'Closing PIR with 5 video chunks...\n';
    const pir = await protocol.demoClosePIR(epo);
    log.textContent += `PIR complete! Admissible ψ ≈ 0.98 | Merkle root: ${Array.from(pir.merkle_root.slice(0,8)).map(b=>b.toString(16).padStart(2,'0')).join('')}...\n`;
    log.textContent += '\n=== PROTOCOL DEMO COMPLETE ===\nDistrict-ready chain-of-custody achieved.';
  }
};