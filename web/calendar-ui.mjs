// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Small DOM helper shared by the monthly and annual calendar views.

import {WEEKDAYS, WEEKDAY_SHORT} from './i18n.mjs';
import {weekday} from './clock.mjs';

// Shared by the small monthly view and every month of the annual view.
// Returns the weekday heading cells plus the blank cells that align day 1 of the
// month with its weekday (the week runs through months without resetting).
export function calendarPrefix(year, month) {
  const cells = WEEKDAY_SHORT.map((name, i) => {
    const cell = document.createElement('span');
    cell.className = 'weekday-heading';
    cell.textContent = name;
    cell.title = WEEKDAYS[i];
    cell.setAttribute('aria-label', WEEKDAYS[i]);
    return cell;
  });
  for (let i = 0; i < weekday(year, month, 1); i++) {
    const blank = document.createElement('span');
    blank.className = 'calendar-blank';
    blank.setAttribute('aria-hidden', 'true');
    cells.push(blank);
  }
  return cells;
}
