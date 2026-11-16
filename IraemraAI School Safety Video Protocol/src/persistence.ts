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

  /**
   * Cross-tab atomic install salt initialization.
   * The IndexedDB read and conditional write occur in one READWRITE transaction:
   * IndexedDB serializes conflicting readwrite transactions on 'system'.
   * Do not use localStorage fallback here because it has no atomic get-or-set.
   */
  async getOrCreateInstallSalt(): Promise<Uint8Array> {
    const db=this.db;
    if (!db) throw new Error('Atomic install salt requires IndexedDB; refusing unsafe fallback');
    if (typeof crypto==='undefined' || typeof crypto.getRandomValues!=='function')
      throw new Error('Secure random source unavailable');
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('system','readwrite');
      const store=tx.objectStore('system');
      const request=store.get('install_salt');
      let salt: Uint8Array | null = null;
      request.onsuccess=()=>{
        const old=request.result;
        if (old===undefined) {
          salt=crypto.getRandomValues(new Uint8Array(32));
          store.put(Array.from(salt),'install_salt');
        } else if (Array.isArray(old) && old.length===32 &&
                   old.every((v:unknown)=>Number.isInteger(v) &&
                     (v as number)>=0 && (v as number)<=255)) {
          salt=Uint8Array.from(old);
        } else {
          tx.abort(); // Invalid stored salt must never be silently replaced.
        }
      };
      request.onerror=()=>tx.abort();
      tx.oncomplete=()=>salt?resolve(new Uint8Array(salt)):reject(new Error('No install salt committed'));
      tx.onerror=()=>reject(tx.error??new Error('Install salt transaction failed'));
      tx.onabort=()=>reject(tx.error??new Error('Stored install salt invalid or transaction aborted'));
    });
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