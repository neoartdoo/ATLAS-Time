// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Historical date converter (pure functions, no DOM). Converts a date between the
// Gregorian, Julian and personal 13-month calendars through the Julian Day Number
// (JDN) and also returns the weekday and the decimal time of day.
// All calendars are proleptic: no country-specific reform dates are applied.

// Isolated historical converter. No changes to the live clock/calendar rules.
import {DAY_MS, customDate, monthLength, decimalTime, WEEKDAYS} from './clock.mjs';
// Supported calendar identifiers.
export const MODES = ['gregorian','julian','personal'];
// Mathematical modulo that stays non-negative for negative numbers.
export const mod = (n,m) => ((n % m) + m) % m;
// Normalise an input year to astronomical numbering (year 0 exists, 0 = 1 BCE, -1 = 2 BCE).
// era: 'astro' (-9999..9999), 'ce' or 'bce' (1..9999, there is no year 0).
export function astronomicalYear(value, era='astro') {
  if(!Number.isInteger(value))throw Error('Godina mora biti ceo broj.');
  if(era==='astro') {if(value < -9999 || value > 9999)throw Error('Astronomska godina mora biti od −9999 do 9999.');return value;}
  if(!['ce','bce'].includes(era)||value<1||value>9999)throw Error('Istorijska godina mora biti od 1 do 9999; nema godine 0.');
  return era==='bce'?1-value:value;
}
// Leap-year rule of the Julian (every 4th year) or Gregorian calendar.
export const leap = (y,calendar) => calendar==='julian'?mod(y,4)===0:mod(y,4)===0&&(mod(y,100)!==0||mod(y,400)===0);
// Days in a month of the given calendar.
export function daysInMonth(y,m,calendar) {
  if(calendar==='personal')return monthLength(y,m);
  return [31,leap(y,calendar)?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
}
// Throw if the calendar, year, month or day is invalid for that calendar.
export function validateDate(y,m,d,calendar) {
  if(!MODES.includes(calendar))throw Error('Izaberi kalendar izvornog datuma.');
  if(!Number.isInteger(y)||Math.abs(y)>10001)throw Error('Godina je van podržanog raspona.');
  if(!Number.isInteger(m)||m<1||m>(calendar==='personal'?13:12)||!Number.isInteger(d)||d<1||d>daysInMonth(y,m,calendar))throw Error('Taj datum ne postoji u izabranom kalendaru.');
}
// Integer JDN labels the noon of the civil date. Only differences are used;
// no implicit time, timezone or historical adoption rule is assigned.
// Civil date -> JDN (the personal calendar goes through Gregorian January 1st + ordinal).
export function toDay(y,m,d,calendar) {
  validateDate(y,m,d,calendar);
  if(calendar==='personal') {
    let ordinal=d;for(let i=1;i<m;i++)ordinal+=monthLength(y,i);
    return toDay(y,1,1,'gregorian')+ordinal-1;
  }
  const a=Math.floor((14-m)/12),Y=y+4800-a,M=m+12*a-3;
  const base=d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4);
  return calendar==='julian'?base-32083:base-Math.floor(Y/100)+Math.floor(Y/400)-32045;
}
// JDN -> civil date {year, month, day} in the requested calendar.
export function fromDay(jdn,calendar) {
  if(!Number.isSafeInteger(jdn)||!MODES.includes(calendar))throw Error('Nevažeći dan.');
  if(calendar==='julian') {
    const c=jdn+32082,d=Math.floor((4*c+3)/1461),e=c-Math.floor(1461*d/4),m=Math.floor((5*e+2)/153);
    return {year:d-4800+Math.floor(m/10),month:m+3-12*Math.floor(m/10),day:e-Math.floor((153*m+2)/5)+1};
  }
  const date=new Date((jdn-2440588)*DAY_MS);
  const g={year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};
  if(calendar==='personal'){const c=customDate(g.year,g.month,g.day);return {year:c.year,month:c.month,day:c.day};}
  return g;
}
// Serbian era label; the UI uses i18n.mjs for translations.
export const eraLabel = year => year<=0?`${1-year}. p. n. e.`:`${year}. n. e.`;
// Signed, zero-padded year (e.g. -0044, 1369).
export const yearLabel = year => (year<0?'−':'')+String(Math.abs(year)).padStart(4,'0');
// Format a date; the personal calendar uses yyyy.mmm.ddd.
export const dateLabel = ({year,month,day},personal=false) => personal?`${yearLabel(year)}.${String(month).padStart(3,'0')}.${String(day).padStart(3,'0')}`:`${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.${yearLabel(year)}`;
// Main entry point: one input date -> the same day in all three calendars, the weekday,
// ordinals, days since 0001-01-01 and (if a time is known) the decimal time. No time
// zone is assumed and no historical time-zone conversion is attempted.
export function convert(input) {
  const year=astronomicalYear(input.year,input.era),jdn=toDay(year,input.month,input.day,input.calendar);
  const gregorian=fromDay(jdn,'gregorian'),julian=fromDay(jdn,'julian'),personal=fromDay(jdn,'personal');
  const ordinal=jdn-toDay(year,1,1,input.calendar)+1;
  const personalOrdinal=jdn-toDay(personal.year,1,1,'gregorian')+1;
  let decimal=null;
  if(input.timeKnown) {
    const {hour,minute,second}=input;
    if(![hour,minute,second].every(Number.isInteger)||hour<0||hour>23||minute<0||minute>59||second<0||second>59)throw Error('Vreme mora biti od 00:00:00 do 23:59:59.');
    decimal=decimalTime(hour*3600000+minute*60000+second*1000);
  }
  return {jdn,gregorian,julian,personal,ordinal,personalOrdinal,weekday:WEEKDAYS[mod(jdn,7)],daysFromEpoch:jdn-toDay(1,1,1,'gregorian'),decimal};
}
// Validate and normalise a saved event (also used for imported JSON files). Limits:
// name <= 200 characters, note <= 2000 characters.
export function validateEvent(e) {
  if(!e||typeof e!=='object'||typeof e.name!=='string'||!e.name.trim()||e.name.length>200||typeof e.note!=='string'||e.note.length>2000)throw Error('Nevažeći zapis događaja.');
  if(!e.input||!['astro','ce','bce'].includes(e.input.era)||(e.input.timeKnown!==undefined&&typeof e.input.timeKnown!=='boolean'))throw Error('Nevažeća oznaka ere ili vremena.');
  convert(e.input);
  return {name:e.name.trim(),note:e.note,input:{year:e.input.year,era:e.input.era,month:e.input.month,day:e.input.day,calendar:e.input.calendar,timeKnown:!!e.input.timeKnown,hour:e.input.hour??0,minute:e.input.minute??0,second:e.input.second??0}};
}
