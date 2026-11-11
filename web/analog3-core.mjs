// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Hand geometry for the three-hand analog clock (tested in tests/analog3.test.mjs).

import {DAY_MS,decimalTime} from './clock.mjs';
export {EXAMPLE_MS} from './analog-core.mjs';
// Milliseconds since midnight -> decimal values and three angles in degrees:
// hours (full circle per day), minutes (per new hour = 864000 ms) and seconds
// (per new minute = 8640 ms).
export function analogHands(ms) {
  const normalized=((ms%DAY_MS)+DAY_MS)%DAY_MS;
  const [hours,minutes,seconds]=decimalTime(normalized);
  // Each hand covers the full 0..100 range; smaller units advance it smoothly.
  return {hours,minutes,seconds,angles:[
    normalized/DAY_MS*360,
    (normalized%864000)/864000*360,
    (normalized%8640)/8640*360
  ]};
}
