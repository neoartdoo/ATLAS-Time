// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Language switch for the user interface (English / Serbian).
// The page language comes from <html lang>, which server.py sets from the
// `atlas_lang` cookie or the ?lang= query parameter.

// UI language only. Calendar arithmetic, timestamps and saved event data are unchanged.
// Current UI language: 'sr' or 'en' (English is the default).
export const lang = typeof document !== 'undefined' && document.documentElement.lang.startsWith('sr') ? 'sr' : 'en';
// Locale passed to Intl / toLocale*String.
export const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-GB';
// t(serbian, english): pick the text for the current language. Used throughout the UI.
export const t = (sr, en) => lang === 'sr' ? sr : en;
const srWeek = ['Ponedeljak','Utorak','Sreda','Četvrtak','Petak','Subota','Nedelja'];
const enWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
// Localized weekday names, full and abbreviated.
export const WEEKDAYS = t(srWeek, enWeek);
export const WEEKDAY_SHORT = t(['PON','UTO','SRE','ČET','PET','SUB','NED'], ['MON','TUE','WED','THU','FRI','SAT','SUN']);
// Translate a Serbian weekday name coming from the core modules.
export const weekdayLabel = name => lang === 'sr' ? name : (enWeek[srWeek.indexOf(name)] ?? name);
// Translate the label of an extra day (leap day / year day).
export const extraLabel = value => value === 'Prestupni dan' ? t(value,'Leap day') : value === 'Dan godine' ? t(value,'Year day') : value;
// Format an astronomical year as BCE/CE (year 0 = 1 BCE).
export const eraLabel = year => year <= 0 ? t(`${1-year}. p. n. e.`, `${1-year} BCE`) : t(`${year}. n. e.`, `${year} CE`);
// The core modules throw Serbian messages; this table maps them to English.
const errors = {
  'Godina mora biti ceo broj.':'The year must be a whole number.',
  'Astronomska godina mora biti od −9999 do 9999.':'The astronomical year must be from −9999 to 9999.',
  'Istorijska godina mora biti od 1 do 9999; nema godine 0.':'The historical year must be from 1 to 9999; there is no year 0.',
  'Izaberi kalendar izvornog datuma.':'Choose the source date’s calendar.',
  'Godina je van podržanog raspona.':'The year is outside the supported range.',
  'Taj datum ne postoji u izabranom kalendaru.':'That date does not exist in the selected calendar.',
  'Nevažeći dan.':'Invalid day.',
  'Vreme mora biti od 00:00:00 do 23:59:59.':'Time must be from 00:00:00 to 23:59:59.',
  'Nevažeći zapis događaja.':'Invalid event entry.',
  'Nevažeća oznaka ere ili vremena.':'Invalid era or time indicator.'
};
// Turn any thrown error into a user-facing message in the current language.
export function errorText(error) {
  if (error instanceof SyntaxError) return t('Fajl nije važeći JSON.','The file is not valid JSON.');
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return t('Server nije odgovorio na vreme.','The server did not respond in time.');
  if (error instanceof TypeError) return t('Zahtev nije uspeo ili podaci nisu važeći.','The request failed or the data is invalid.');
  return lang === 'sr' ? error.message : (errors[error.message] ?? error.message);
}
// Browser-only part (the Node tests import this file without a DOM).
if (typeof document !== 'undefined') {
  const select = document.getElementById('language');
  if (select) {
    select.value = lang;
    select.addEventListener('change', () => {
      const next = select.value;
      if (!['en','sr'].includes(next)) return;
      // This first-party preference cookie works offline and is shared by all app pages.
      document.cookie = `atlas_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
      const url = new URL(location.href);
      url.searchParams.set('lang',next);
      location.assign(url);
    });
  }
  // Keep explicit language links usable even when preference cookies are disabled.
  const explicit = new URLSearchParams(location.search).get('lang');
  if (explicit === 'en' || explicit === 'sr') {
    for (const a of document.querySelectorAll('a[href^="/"]')) {
      const url = new URL(a.href);
      if (url.pathname !== '/health') {url.searchParams.set('lang',lang);a.href=url.href;}
    }
  }
}
