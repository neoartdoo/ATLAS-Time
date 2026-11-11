import test from 'node:test';
import assert from 'node:assert/strict';
import {toDay,fromDay,astronomicalYear,convert,validateEvent,daysInMonth,MODES} from '../web/history-core.mjs';
import {gregorianDate,DAY_MS,weekday,WEEKDAYS} from '../web/clock.mjs';
test('year zero corresponds to 1 BCE, historical CE has no zero',()=>{
  assert.equal(astronomicalYear(1,'bce'),0);
  assert.equal(astronomicalYear(2,'bce'),-1);
  assert.equal(astronomicalYear(-9999,'astro'),-9999);
  assert.throws(()=>astronomicalYear(0,'ce'));
  assert.throws(()=>astronomicalYear(0,'bce'));
  assert.equal(toDay(1,1,1,'gregorian')-toDay(0,12,31,'gregorian'),1);
});
test('independent standard JDN anchors, reform and leap exceptions',()=>{
  assert.equal(toDay(2000,1,1,'gregorian'),2451545);
  assert.equal(toDay(1970,1,1,'gregorian'),2440588);
  assert.equal(toDay(-4712,1,1,'julian'),0);
  assert.equal(toDay(1582,10,4,'julian'),2299160);
  assert.equal(toDay(1582,10,15,'gregorian'),2299161);
  assert.deepEqual(fromDay(2299160,'gregorian'),{year:1582,month:10,day:14});
  assert.throws(()=>toDay(1900,2,29,'gregorian'));
  assert.doesNotThrow(()=>toDay(1900,2,29,'julian'));
  assert.doesNotThrow(()=>toDay(0,2,29,'gregorian'));
});
test('all dates in representative BCE, zero, CE and boundary years round-trip',()=>{
  for(const calendar of MODES)for(const year of [-9999,-4801,-4800,-4712,-400,-100,-4,-1,0,1,99,100,1369,1582,1900,2000,2026,9999]){
    for(let month=1;month<=(calendar==='personal'?13:12);month++)for(let day=1;day<=daysInMonth(year,month,calendar);day++){
      const j=toDay(year,month,day,calendar);
      assert.deepEqual(fromDay(j,calendar),{year,month,day});
      for(const other of MODES){const d=fromDay(j,other);assert.equal(toDay(d.year,d.month,d.day,other),j);}
    }
  }
});
test('historical extension agrees with existing personal calendar',()=>{
  for(const year of [1,100,1026,1369,1582,2024,2026,3026,9999])for(let month=1;month<=13;month++){
    for(const day of [1,28]){
      assert.equal(toDay(year,month,day,'personal'),gregorianDate(year,month,day)/DAY_MS+2440588);
      const r=convert({year,era:'astro',month,day,calendar:'personal'});
      assert.equal(r.weekday,WEEKDAYS[weekday(year,month,day)]);
    }
  }
});
test('user example uses ordinal 194, with different source calendars',()=>{
  const input={year:1369,era:'astro',month:7,day:13};
  const g=convert({...input,calendar:'gregorian'}),j=convert({...input,calendar:'julian'});
  assert.equal(g.ordinal,194);assert.deepEqual(g.personal,{year:1369,month:7,day:26});
  assert.deepEqual(j.gregorian,{year:1369,month:7,day:21});
  assert.deepEqual(j.personal,{year:1369,month:8,day:6});
});
test('unknown time stays unknown; known time converts units only',()=>{
  const input={year:0,era:'astro',month:1,day:1,calendar:'gregorian'};
  assert.equal(convert(input).decimal,null);
  assert.deepEqual(convert({...input,timeKnown:true,hour:12,minute:0,second:0}).decimal,[50,0,0,0]);
  assert.throws(()=>convert({...input,timeKnown:true,hour:24,minute:0,second:0}));
  assert.throws(()=>validateEvent({name:'Test',note:'',input:{...input,month:2,day:30}}));
  assert.equal(validateEvent({name:' Test ',note:'source',input}).name,'Test');
});
