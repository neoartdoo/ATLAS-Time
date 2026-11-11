// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Hand geometry for the five-hand analog clock (pure functions, tested in tests/analog.test.mjs).

import {DAY_MS,decimalTime} from './clock.mjs';
// Milliseconds since midnight -> decimal values, the four digits and five angles in degrees:
// [tens of hours, units of hours, tens of minutes, units of minutes, seconds].
export function analogHands(ms) {
  const normalized=((ms%DAY_MS)+DAY_MS)%DAY_MS;
  const [hours,minutes,seconds]=decimalTime(normalized);
  const digits=[Math.floor(hours/10),hours%10,Math.floor(minutes/10),minutes%10];
  // Digit hand: digit * 36 degrees (10 marks on the dial).
  // Digit hands point exactly at 0..9. Seconds sweep once per new minute.
  return {hours,minutes,seconds,digits,angles:[...digits.map(n=>n*36),(normalized%8640)/8640*360]};
}
// The frozen example time 57:24:12 in milliseconds (one new second = 86.4 ms).
export const EXAMPLE_MS = (57*10000+24*100+12)*86.4;
