// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Atlas stardate: whole UTC days since 0001-01-01 00:00 UTC plus the decimal time
// of day. Example: 739896.073.069.073 = 739896 + 73/100 + 69/10^4 + 73/10^6 days.
// Always UTC, independent of the zone chosen on the page.

// Atlas day number: 0001-01-01 00:00 UTC = 0. Six decimals = new seconds.
const DAY_MS = 86400000;
// Day number of 1970-01-01 (Unix epoch) counted from 0001-01-01.
const UNIX_EPOCH_DAY = 719162;
// Build the stardate from a day number and milliseconds into that day. The time part
// is truncated (not rounded) to six decimals; BigInt keeps the sign right for negative days.
export function fromDayAndMs(day, ms) {
  if(!Number.isSafeInteger(day)||!Number.isFinite(ms)||ms<0||ms>=DAY_MS)throw new RangeError('Nevažeći broj dana ili vreme.');
  const tick = Math.floor(ms * 1000000 / DAY_MS);
  const hours = Math.floor(tick / 10000), minutes = Math.floor(tick / 100) % 100, seconds = tick % 100;
  const scaled = BigInt(day) * 1000000n + BigInt(tick);
  const absolute = scaled < 0n ? -scaled : scaled;
  const number = `${scaled<0n?'-':''}${absolute/1000000n}.${String(absolute%1000000n).padStart(6,'0')}`;
  return {day,hours,minutes,seconds,number,
    display:`${day}.${[hours,minutes,seconds].map(n=>String(n).padStart(3,'0')).join('.')}`};
}
// Stardate for a Unix timestamp in milliseconds.
export function stardate(epochMs) {
  if(!Number.isFinite(epochMs))throw new RangeError('Nevažeće vreme.');
  const day = Math.floor(epochMs / DAY_MS) + UNIX_EPOCH_DAY;
  const ms = ((epochMs % DAY_MS) + DAY_MS) % DAY_MS;
  return fromDayAndMs(day, ms);
}
