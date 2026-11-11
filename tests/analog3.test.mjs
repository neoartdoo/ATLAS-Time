import test from 'node:test';
import assert from 'node:assert/strict';
import {analogHands,EXAMPLE_MS} from '../web/analog3-core.mjs';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<0.000001,`${actual} vs ${expected}`);
test('57:24:12 is preserved with exactly three continuous hands',()=>{
  const s=analogHands(EXAMPLE_MS);
  assert.equal(s.angles.length,3);
  assert.deepEqual([s.hours,s.minutes,s.seconds],[57,24,12]);
  close(s.angles[0],57.2412*3.6);
  close(s.angles[1],24.12*3.6);
  close(s.angles[2],12*3.6);
});
test('hand revolutions use a day, a new hour and a new minute',()=>{
  close(analogHands(43200000).angles[0],180);
  close(analogHands(432000).angles[1],180);
  close(analogHands(4320).angles[2],180);
  close(analogHands(864000).angles[1],0);
  close(analogHands(8640).angles[2],0);
  assert.deepEqual(analogHands(86400000).angles,[0,0,0]);
});
test('unit values are visible in the position instead of being discarded',()=>{
  close(analogHands(57*864000).angles[0],205.2);
  close(analogHands(24*8640).angles[1],86.4);
  assert.ok(analogHands(57*864000+1000).angles[0]>205.2);
  assert.ok(analogHands(24*8640+1000).angles[1]>86.4);
});
