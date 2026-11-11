import test from 'node:test';
import assert from 'node:assert/strict';
import {analogHands,EXAMPLE_MS} from '../web/analog-core.mjs';
test('57 hours 24 minutes: hands point exactly to 5, 7, 2 and 4',()=>{
  const state=analogHands(EXAMPLE_MS);
  assert.deepEqual(state.digits,[5,7,2,4]);
  assert.deepEqual(state.angles.slice(0,4),[180,252,72,144]);
  assert.equal(state.seconds,12);
  assert.ok(Math.abs(state.angles[4]-43.2)<0.00001);
});
test('seconds make one revolution in 8.64 current seconds',()=>{
  assert.equal(analogHands(0).angles[4],0);
  assert.equal(analogHands(4320).angles[4],180);
  assert.ok(analogHands(8639).angles[4]>359);
  assert.equal(analogHands(8640).angles[4],0);
  assert.deepEqual(analogHands(8640).digits,[0,0,0,1]);
});
test('decimal digit carry and midnight reset',()=>{
  assert.deepEqual(analogHands(10*8640).digits,[0,0,1,0]);
  assert.deepEqual(analogHands(10*864000).digits,[1,0,0,0]);
  assert.deepEqual(analogHands(86400000-1).digits,[9,9,9,9]);
  assert.deepEqual(analogHands(86400000).digits,[0,0,0,0]);
});
