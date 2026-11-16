// Browser-only demonstration, NOT an emergency response or evidence system.
import { PersistentStore } from './persistence';
import { OverrideValidator } from './validator';
import { ComplianceMonitor } from './compliance';

export type DemoEPO = { demo_nonce: Uint8Array };
export type DemoPIR = { demo_digest: Uint8Array };

export class IraemraProtocol {
  private readonly store = new PersistentStore();
  private readonly validator = new OverrideValidator(this.store, []);
  private readonly monitor = new ComplianceMonitor(this.store);
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.store.init();
    await this.validator.init();
    this.initialized = true;
    this.monitor.start();
  }

  async demoEmergencyOverride(): Promise<DemoEPO> {
    if (!this.initialized) throw new Error('Initialize the demo first');
    // This is a random demo nonce, not a signed or authorized EPO.
    return { demo_nonce: crypto.getRandomValues(new Uint8Array(32)) };
  }

  async demoClosePIR(epo: DemoEPO): Promise<DemoPIR> {
    if (!this.initialized) throw new Error('Initialize the demo first');
    // A single SHA-256 digest is not a Merkle tree or custody verification.
    const bytes = new Uint8Array(epo.demo_nonce.byteLength);
    bytes.set(epo.demo_nonce);
    const digest = await crypto.subtle.digest('SHA-256', bytes.buffer);
    return { demo_digest: new Uint8Array(digest) };
  }
}
