// iraemra.ts - Main Protocol Integration
import { FixedMath } from './fixedmath';
import { PersistentStore } from './persistence';
import { OverrideValidator } from './validator';
import { ComplianceMonitor } from './compliance';

export class IraemraProtocol {
  private store: PersistentStore;
  private validator: OverrideValidator;
  private monitor: ComplianceMonitor;

  constructor() {
    this.store = new PersistentStore();
    this.validator = new OverrideValidator(this.store, []); // Pass admin keys
    this.monitor = new ComplianceMonitor(this.store);
  }

  async init(): Promise<void> {
    await this.store.init();
    await this.validator.init();
    this.monitor.start();
  }

  // demoEmergencyOverride and demoClosePIR for live demo
  async demoEmergencyOverride() {
    // Simulated token creation and override
    console.log('Demo EPO triggered');
    return { override_hash: crypto.getRandomValues(new Uint8Array(32)) };
  }

  async demoClosePIR(epo: any) {
    return { merkle_root: crypto.getRandomValues(new Uint8Array(32)) };
  }
}