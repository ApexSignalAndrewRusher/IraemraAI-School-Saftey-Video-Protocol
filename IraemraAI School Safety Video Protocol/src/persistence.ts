// persistence.ts - IndexedDB + LocalStorage Fallback
export class PersistentStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if ('indexedDB' in window) {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('iraemra_v1_8_1', 3);
        req.onupgradeneeded = () => {
          const db = req.result;
          ['bad_actors', 'overrides', 'system'].forEach(s => {
            if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
          });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
  }

  async get(store: string, key: string): Promise<any> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(store);
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
      });
    }
    const val = localStorage.getItem(`${store}:${key}`);
    return val ? JSON.parse(val) : null;
  }

  async set(store: string, key: string, value: any): Promise<void> {
    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db!.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = reject;
      });
    } else {
      localStorage.setItem(`${store}:${key}`, JSON.stringify(value));
    }
  }

  async appendLog(store: string, value: any): Promise<void> {
    const MAX_ENTRIES = 10000;
    const size = JSON.stringify(value).length;
    if (size > 10000) throw new Error('Log entry too large');

    let count = (await this.get(store, 'count')) || 0;
    if (count >= MAX_ENTRIES) {
      await this.rotateLog(store);
      count = MAX_ENTRIES - 1000; // Keep buffer
    }

    const key = `entry_${count}`;
    await this.set(store, key, value);
    await this.set(store, 'count', count + 1);
  }

  private async rotateLog(store: string): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(store, 'readwrite');
        const cursorReq = tx.objectStore(store).openCursor();
        let deleted = 0;
        cursorReq.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor && deleted < 5000) {
            cursor.delete();
            deleted++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = reject;
      });
    } else {
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${store}:entry_`))
        .sort();
      keys.slice(0, 5000).forEach(k => localStorage.removeItem(k));
    }
  }
}