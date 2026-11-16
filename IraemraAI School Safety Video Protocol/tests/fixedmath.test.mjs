import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { FixedMath } from '../src/fixedmath.ts';

test('monotonic time is measured in microseconds, not nanoseconds',()=>{
  const lower=performance.now()*1000-2000;
  const value=Number(FixedMath.now());
  const upper=performance.now()*1000+2000;
  assert.ok(value>=lower && value<=upper, String(value));
});

test('fixed point conversion rejects nonfinite inputs',()=>{
  assert.equal(FixedMath.fromNumber(1.5),1500000n);
  assert.equal(FixedMath.computePsi(800000n,700000n,900000n),700000n);
  assert.throws(()=>FixedMath.fromNumber(Infinity),RangeError);
  assert.throws(()=>FixedMath.fromNumber(NaN),RangeError);
});

test('demo and crypto implementation never claim verified chain of custody',()=>{
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  const proto=readFileSync(new URL('../src/iraemra.ts',import.meta.url),'utf8');
  const crypto=readFileSync(new URL('../src/rosettastone.ts',import.meta.url),'utf8');
  assert.doesNotMatch(main,/District-ready|Admissible|chain-of-custody achieved/i);
  assert.match(main,/No safety response, video evidence, signed override/);
  assert.match(proto,/crypto\.subtle\.digest\('SHA-256'/);
  assert.doesNotMatch(crypto,/digestSync/);
});

test('validator refuses unimplemented overrides',()=>{
  const validator=readFileSync(new URL('../src/validator.ts',import.meta.url),'utf8');
  assert.match(validator,/Override authorization NOT IMPLEMENTED/);
});
