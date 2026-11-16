// Browser-only demonstration, NOT an emergency response or evidence system.
import { PersistentStore } from './persistence.ts';
import { OverrideValidator } from './validator.ts';
import { ComplianceMonitor } from './compliance.ts';
import { digestDemoNonce } from './replay.ts';

export type DemoEPO = { demo_nonce: Uint8Array };
export type DemoPIR = { demo_digest: Uint8Array };

export class IraemraProtocol {
  private readonly store: PersistentStore;
  private readonly validator: OverrideValidator;
  private readonly monitor: ComplianceMonitor;
  private initialized = false;
  private initializing: Promise<void> | null = null;

  constructor(store: PersistentStore = new PersistentStore(), monitor?: ComplianceMonitor) {
    this.store = store;
    this.validator = new OverrideValidator(store, []);
    this.monitor = monitor ?? new ComplianceMonitor(store);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;
    this.initializing = (async () => {
      await this.store.init();
      await this.validator.init();
      this.monitor.start();
      this.initialized = true;
    })();
    try { await this.initializing; }
    catch (error) {
      this.initializing = null;
      throw error;
    }
  }

  async demoEmergencyOverride(): Promise<DemoEPO> {
    if (!this.initialized) throw new Error('Initialize the demo first');
    // This is a random demo nonce, not a signed or authorized EPO.
    return { demo_nonce: crypto.getRandomValues(new Uint8Array(32)) };
  }

  async demoClosePIR(epo: DemoEPO): Promise<DemoPIR> {
    if (!this.initialized) throw new Error('Initialize the demo first');
    // A single SHA-256 digest is not a Merkle tree or custody verification.
    return { demo_digest: await digestDemoNonce(epo.demo_nonce) };
  }
}
