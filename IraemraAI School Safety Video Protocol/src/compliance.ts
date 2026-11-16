// compliance.ts - SLA Monitor
import type { PersistentStore } from './persistence.ts';

export class ComplianceMonitor {
  private store: PersistentStore;
  private readonly MAX_UNREVIEWED = 10;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(store: PersistentStore) {
    this.store = store;
  }

  start(): void {
    if (this.timer !== null) return; // Repeated demo clicks cannot multiply monitors.
    this.timer = setInterval(() => {
      void this.enforceSLA().catch(error => console.error('Demo compliance monitor failed:', error));
    }, 60_000);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  async enforceSLA(): Promise<void> {
    const unreviewed = (await this.store.get('system', 'unreviewed_bad_actors')) || 0;
    const locked = await this.store.get('system', 'compliance_lockdown');

    if (unreviewed > this.MAX_UNREVIEWED && !locked) {
      await this.store.set('system', 'compliance_lockdown', true);
      console.error('🚨 COMPLIANCE LOCKDOWN');
    } else if (unreviewed <= this.MAX_UNREVIEWED && locked) {
      await this.store.set('system', 'compliance_lockdown', false);
    }
  }
}