import test from 'node:test';
import assert from 'node:assert/strict';
import {DAY_MS,decimalTime,customDate,wallParts,isLeap,monthLength,gregorianDate,utcDate,validYear,weekday} from '../web/clock.mjs';

test('decimal midnight, noon and final millisecond; no 100 overflow',()=>{
  assert.deepEqual(decimalTime(0),[0,0,0,0]);
  assert.deepEqual(decimalTime(DAY_MS/2),[50,0,0,0]);
  assert.deepEqual(decimalTime(DAY_MS-1),[99,99,99,98]);
  assert.deepEqual(decimalTime(DAY_MS),[0,0,0,0]);
  assert.deepEqual(decimalTime(864000),[1,0,0,0]);
});
test('all dates round-trip uniquely, including years 1-99 and ±1000 years',()=>{
  for(const y of [1,4,99,100,400,1026,1600,1900,2000,2024,2026,2100,2400,3026,9999]){
    const mapped=new Set();
    for(let ordinal=1;ordinal<=(isLeap(y)?366:365);ordinal++){
      const d=utcDate(y,1,ordinal),c=customDate(y,d.getUTCMonth()+1,d.getUTCDate());
      assert.equal(c.ordinal,ordinal);
      assert.ok(c.month>=1&&c.month<=13&&c.day>=1&&c.day<=monthLength(y,c.month));
      assert.equal(+gregorianDate(y,c.month,c.day),+d);
      mapped.add(`${c.month}-${c.day}`);
    }
    assert.equal(mapped.size,isLeap(y)?366:365);
  }
});
test('year totals throughout the supported 0001-9999 range',()=>{
  for(let year=1;year<=9999;year++){
    const lengths=Array.from({length:13},(_,i)=>monthLength(year,i+1));
    assert.equal(lengths.reduce((a,b)=>a+b,0),isLeap(year)?366:365);
    assert.equal(lengths[12],29);
    assert.equal(lengths[0],isLeap(year)?29:28);
    assert.ok(lengths.slice(1,12).every(n=>n===28));
  }
});
test('extra days belong to the first and last months',()=>{
  assert.equal(customDate(2026,12,30).day,28);
  assert.equal(customDate(2026,12,31).month,13);
  assert.equal(customDate(2026,12,31).day,29);
  assert.equal(customDate(2026,12,31).extra,'Dan godine');
  assert.equal(customDate(2024,1,29).month,1);
  assert.equal(customDate(2024,1,29).day,29);
  assert.equal(customDate(2024,1,29).extra,'Prestupni dan');
  assert.equal(customDate(2024,1,30).month,2);
  assert.equal(customDate(2024,1,30).day,1);
  assert.equal(customDate(2024,12,30).day,28);
  assert.equal(customDate(2024,12,31).day,29);
  assert.equal(customDate(2027,1,1).ordinal,1);
  assert.equal(isLeap(2100),false); assert.equal(isLeap(2400),true);
});
test('invalid dates and unsupported years are rejected',()=>{
  for(const y of [0,-1,10000,2026.5,NaN])assert.equal(validYear(y),false);
  assert.throws(()=>gregorianDate(2026,1,29),RangeError);
  assert.throws(()=>gregorianDate(2024,2,29),RangeError);
  assert.throws(()=>gregorianDate(2024,14,1),RangeError);
  assert.throws(()=>gregorianDate(10000,1,1),RangeError);
});
test('fixed zone midnight rolls date and decimal clock together',()=>{
  const p=wallParts(Date.parse('2026-12-31T23:00:00Z'),'fixed1');
  assert.deepEqual([p.year,p.month,p.day,p.ms],[2027,1,1,0]);
  assert.deepEqual(decimalTime(p.ms),[0,0,0,0]);
});
test('Berlin summer/winter behavior is explicit, fixed zones do not jump',()=>{
  const before=Date.parse('2026-03-29T00:59:59Z'),after=before+1000;
  assert.equal(wallParts(before,'berlin').hour,1);
  assert.equal(wallParts(after,'berlin').hour,3);
  assert.equal(wallParts(after,'fixed1').ms-wallParts(before,'fixed1').ms,1000);
  const autumn=Date.parse('2026-10-25T01:00:00Z');
  assert.equal(wallParts(autumn-1000,'berlin').hour,2);
  assert.equal(wallParts(autumn,'berlin').hour,2);
  assert.equal(wallParts(autumn,'berlin').minute,0);
});
test('known wall time is reproducible after restart',()=>{
  const epoch=Date.parse('2026-10-08T11:30:00.000Z');
  const a=wallParts(epoch,'fixed1'), b=wallParts(epoch,'fixed1');
  assert.deepEqual(decimalTime(a.ms),decimalTime(b.ms));
  assert.deepEqual(decimalTime(a.ms),[52,8,33,33]);
  assert.deepEqual(customDate(a.year,a.month,a.day),{year:2026,ordinal:281,month:11,day:1,extra:null,length:365});
});

test('weekdays have one anchor and include extra days without resetting',()=>{
  assert.equal(weekday(1,1,1),0); // Monday
  assert.equal(weekday(2021,13,29),4); // Friday, December 31
  assert.equal(weekday(2022,1,1),5); // Saturday, January 1
  assert.equal(weekday(2024,1,28),6); // Sunday
  assert.equal(weekday(2024,1,29),0); // Monday, leap day in personal calendar
  assert.equal(weekday(2024,2,1),1); // Tuesday
  assert.equal(weekday(2026,11,1),3); // Thursday, October 8
});
test('every month and year boundary remains continuous for years 0001-9999',()=>{
  for(let year=1;year<=9999;year++){
    for(let month=1;month<13;month++){
      assert.equal(weekday(year,month+1,1),(weekday(year,month,monthLength(year,month))+1)%7);
    }
    if(year<9999)assert.equal(weekday(year+1,1,1),(weekday(year,13,29)+1)%7);
  }
});
