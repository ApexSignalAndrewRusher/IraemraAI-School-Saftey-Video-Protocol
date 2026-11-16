import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { copyDemoNonce, digestDemoNonce, equalDemoBytes } from '../src/replay.ts';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

test('same nonce yields identical replay digest; changed nonce differs', async()=>{
  const input=Uint8Array.from({length:32},(_,i)=>i);
  const initial=await digestDemoNonce(input);
  const repeat=await digestDemoNonce(input);
  assert.equal(initial.length,32);
  assert.ok(equalDemoBytes(initial,repeat));
  const changed=new Uint8Array(input);changed[0]^=1;
  const changedDigest=await digestDemoNonce(changed);
  assert.equal(equalDemoBytes(initial,changedDigest),false);
});

test('nonce input is copied rather than aliased; malformed input fails closed', async()=>{
  const input=new Uint8Array(32);
  const copy=copyDemoNonce(input);
  input[0]=255;
  assert.equal(copy[0],0);
  assert.throws(()=>copyDemoNonce(new Uint8Array(0)),RangeError);
  assert.throws(()=>copyDemoNonce(new Uint8Array(33)),RangeError);
  assert.throws(()=>copyDemoNonce(null),RangeError);
});

test('digest comparison is only byte equivalence, not evidence verification',()=>{
  assert.equal(equalDemoBytes(new Uint8Array([1,2]),new Uint8Array([1,2])),true);
  assert.equal(equalDemoBytes(new Uint8Array([1,2]),new Uint8Array([1,3])),false);
  assert.equal(equalDemoBytes(new Uint8Array([1]),new Uint8Array([1,0])),false);
});
