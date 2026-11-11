// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Core calendar and decimal-time maths. Pure functions, no DOM access, so the
// same code runs in the browser and in the Node tests (tests/clock.test.mjs).
// Everything else (clocks, calendar views, converter) builds on this file.

// Milliseconds in one conventional 24-hour day.
export const DAY_MS = 86400000;
// Gregorian leap rule, applied proleptically (also to years before 1582).
export const isLeap = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
// Supported range of the personal calendar.
export const MIN_YEAR = 1, MAX_YEAR = 9999;
// True for whole years inside MIN_YEAR..MAX_YEAR.
export function validYear(year) {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}
// Date.UTC treats 0..99 as 1900..1999; setUTCFullYear preserves early years.
export function utcDate(year, month = 1, day = 1) {
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  return d;
}
// Days in a personal-calendar month (1..13). Month 1 gets a 29th day in leap
// years and month 13 always has 29, so a year has 365 or 366 days.
export function monthLength(year, month) {
  return 28 + Number(month === 13 || (month === 1 && isLeap(year)));
}
// Convert a personal-calendar date (year, month 1..13, day) to the UTC Date of
// the same civil day. Throws RangeError for dates that do not exist.
export function gregorianDate(year, month, day) {
  if (!validYear(year) || !Number.isInteger(month) || month < 1 || month > 13 ||
      !Number.isInteger(day) || day < 1 || day > monthLength(year, month)) {
    throw new RangeError('Datum je izvan podržanog kalendara.');
  }
  let ordinal = day;
  for (let m = 1; m < month; m++) ordinal += monthLength(year, m);
  return utcDate(year, 1, ordinal);
}
// Serbian weekday names, Monday first. i18n.mjs exports a localized copy for the UI.
export const WEEKDAYS = ['Ponedeljak','Utorak','Sreda','Četvrtak','Petak','Subota','Nedelja'];
export const WEEKDAY_SHORT = ['PON','UTO','SRE','ČET','PET','SUB','NED'];
// 0001-01-01 = Monday. Every day counts, including both additional days.
// Returns 0 (Monday) .. 6 (Sunday).
export function weekday(year, month, day) {
  return Math.round((gregorianDate(year, month, day) - utcDate(1)) / DAY_MS) % 7;
}
// Milliseconds since midnight -> [hours, minutes, seconds, hundredths] on the
// 100/100/100/100 scale. A day is 10^8 ticks, so one tick = 0.864 ms. The input is
// wrapped into 0..DAY_MS first, so negative or oversized values never yield 100.
export function decimalTime(ms) {
  const ticks = Math.floor((((ms % DAY_MS) + DAY_MS) % DAY_MS) * 100000000 / DAY_MS);
  return [Math.floor(ticks / 1000000), Math.floor(ticks / 10000) % 100, Math.floor(ticks / 100) % 100, ticks % 100];
}
// Map a Gregorian civil date to the personal calendar. Returns the ordinal day of
// the year, month 1..13, day 1..29, the year length, and a label for the extra
// 29th day ('Prestupni dan' = leap day, 'Dan godine' = year day; translated in i18n.mjs).
export function customDate(year, month, day) {
  const ordinal = Math.floor((utcDate(year, month, day) - utcDate(year)) / DAY_MS) + 1;
  let customMonth = 1, customDay = ordinal;
  while (customMonth < 13 && customDay > monthLength(year, customMonth)) {
    customDay -= monthLength(year, customMonth++);
  }
  const extra = customDay === 29 ? (customMonth === 1 ? 'Prestupni dan' : 'Dan godine') : null;
  return {year, ordinal, month:customMonth, day:customDay, extra, length:isLeap(year) ? 366 : 365};
}
// Formatter used to read Europe/Berlin wall-clock parts; the Intl database handles DST.
const berlin = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Berlin', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
// Wall-clock parts of an epoch (ms) in a time basis:
//   'fixed1' UTC+01 (default, every day has 24 h), 'fixed2' UTC+02, 'utc',
//   'berlin' (follows daylight saving, so two days a year have 23 or 25 h).
// `ms` is milliseconds since local midnight and feeds decimalTime().
export function wallParts(epoch, zone = 'fixed1') {
  let d;
  if (zone === 'berlin') {
    const p = Object.fromEntries(berlin.formatToParts(new Date(epoch)).map(x => [x.type, x.value]));
    d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second, ((epoch % 1000) + 1000) % 1000));
  } else {
    const offset = {utc:0, fixed1:1, fixed2:2}[zone] ?? 1;
    d = new Date(epoch + offset * 3600000);
  }
  return {year:d.getUTCFullYear(), month:d.getUTCMonth()+1, day:d.getUTCDate(), hour:d.getUTCHours(), minute:d.getUTCMinutes(), second:d.getUTCSeconds(), ms:d.getUTCHours()*3600000+d.getUTCMinutes()*60000+d.getUTCSeconds()*1000+d.getUTCMilliseconds()};
}
// Left-pad a number with zeros (3 digits by default, e.g. 007).
export const pad = (n, width = 3) => String(n).padStart(width, '0');
