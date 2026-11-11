import test from 'node:test';
import assert from 'node:assert/strict';
import {stardate,fromDayAndMs} from '../web/stardate.mjs';
test('zero-based epoch and both user dates',()=>{
  assert.equal(stardate(Date.parse('0001-01-01T00:00:00Z')).number,'0.000000');
  assert.equal(stardate(Date.parse('1970-01-01T00:00:00Z')).day,719162);
  assert.equal(stardate(Date.parse('1985-04-26T00:00:00Z')).day,724756);
  assert.equal(stardate(Date.parse('2026-10-08T00:00:00Z')).day,739896);
});
test('three padded clock fields become six decimal places, not nine',()=>{
  const s=fromDayAndMs(739896,736973*86.4+0.01);
  assert.equal(s.display,'739896.073.069.073');
  assert.equal(s.number,'739896.736973');
  assert.equal(fromDayAndMs(739896,43200000).number,'739896.500000');
});
test('midnight and BCE fractions retain correct numerical sign',()=>{
  const epoch=Date.parse('0001-01-01T00:00:00Z');
  assert.equal(stardate(epoch-1).number,'-0.000001');
  assert.equal(fromDayAndMs(-1,43200000).number,'-0.500000');
  const t=Date.parse('2026-10-08T00:00:00Z');
  assert.equal(stardate(t-1).number,'739895.999999');
  assert.equal(stardate(t).number,'739896.000000');
});
test('same instant in different timezone notation has the same number',()=>{
  assert.equal(stardate(Date.parse('2026-10-08T17:00:00+02:00')).number,stardate(Date.parse('2026-10-08T15:00:00Z')).number);
});
