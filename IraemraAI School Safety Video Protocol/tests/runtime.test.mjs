import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { PersistentStore } from '../src/persistence.ts';
import { RosettaStone } from '../src/rosettastone.ts';
import { IraemraProtocol } from '../src/iraemra.ts';
import { OverrideValidator } from '../src/validator.ts';

// The browser-native algorithms execute in Node through Web Crypto.
if (!globalThis.crypto) globalThis.crypto = webcrypto;

function serializedDatabase() {
  const values=new Map();
  let queue=Promise.resolve();
  let writes=0;
  const db={
    transaction(_name,mode) {
      assert.equal(mode,'readwrite');
      let release;
      const predecessor=queue;
      queue=new Promise(done=>{release=done;});
      let aborted=false;
      const tx={
        error:null, oncomplete:null, onerror:null, onabort:null,
        abort() { aborted=true; },
        objectStore() {
          return {
            get(key) {
              const request={result:undefined,onsuccess:null,onerror:null};
              queueMicrotask(async()=>{
                await predecessor;
                request.result=values.has(key)?values.get(key):undefined;
                try { request.onsuccess?.(); }
                catch(error) {tx.error=error;aborted=true;}
                queueMicrotask(()=>{
                  try {
                    if(aborted) tx.onabort?.();
                    else tx.oncomplete?.();
                  } finally {release();}
                });
              });
              return request;
            },
            put(value,key) {
              values.set(key,value);
              writes++;
            },
          };
        },
      };
      return tx;
    },
  };
  return { db,writes:()=>writes,values };
}

test('simultaneous instances agree on one atomic persisted salt',async()=>{
  const state=serializedDatabase();
  const a=new PersistentStore(), b=new PersistentStore();
  a.db=state.db;
  b.db=state.db;
  const first=new RosettaStone(a), second=new RosettaStone(b);
  await Promise.all([first.init(),second.init()]);
  assert.equal(state.writes(),1);
  const key=Uint8Array.from({length:32},(_,i)=>i);
  assert.deepEqual(await first.saltHash(key),await second.saltHash(key));
});

test('cryptographic salt refuses nontransactional storage and corrupted entries',async()=>{
  const store=new PersistentStore();
  await assert.rejects(store.getOrCreateInstallSalt(),/requires IndexedDB/);
  const state=serializedDatabase();
  state.values.set('install_salt',[1,2,3]);
  store.db=state.db;
  await assert.rejects(store.getOrCreateInstallSalt(),/invalid|aborted/i);
  assert.equal(state.writes(),0);
});

test('real validator never accepts an unimplemented override',()=>{
  const store=new PersistentStore();
  const validator=new OverrideValidator(store,[]);
  assert.throws(()=>validator.attemptOverride(0n),/NOT IMPLEMENTED/);
});

test('real demo returns the SHA-256 of the nonce and coalesces initialization',async()=>{
  const counters={init:0,start:0};
  const store={
    async init() {counters.init++;await Promise.resolve();},
    async getOrCreateInstallSalt() {return new Uint8Array(32).fill(7);},
  };
  const monitor={start(){counters.start++;}};
  const protocol=new IraemraProtocol(store,monitor);
  await Promise.all([protocol.init(),protocol.init(),protocol.init()]);
  assert.deepEqual(counters,{init:1,start:1});
  const epo=await protocol.demoEmergencyOverride();
  assert.equal(epo.demo_nonce.length,32);
  const pir=await protocol.demoClosePIR(epo);
  const expected=new Uint8Array(await crypto.subtle.digest('SHA-256',epo.demo_nonce));
  assert.deepEqual(pir.demo_digest,expected);
});
