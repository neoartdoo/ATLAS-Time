// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Annual calendar: all 13 months of one year, year navigation (+-1, 100, 1000), and the
// Gregorian date behind every day. Used by app.mjs on the /calendar route.

import {t, WEEKDAYS} from './i18n.mjs';
import {customDate, gregorianDate, monthLength, isLeap, validYear, MIN_YEAR, MAX_YEAR, pad, weekday} from './clock.mjs';
import {calendarPrefix} from './calendar-ui.mjs';

// Set up the annual view. `getNow` returns the current wall-clock parts. Returns
// {refresh} so the main page can redraw it when the date changes. On other routes
// it only marks the navigation and returns a no-op.
export function initYearCalendar(getNow) {
  const active = /(^|\/)calendar\/?$/.test(location.pathname); // also matches /<base>/calendar/ in the static demo
  const $ = id => document.getElementById(id);
  if (!active) { $('nav-clock').setAttribute('aria-current','page'); return {refresh(){}}; }
  document.body.classList.add('year-view');
  document.title=t("ATLAS Personal Time · Godišnji kalendar","ATLAS Personal Time · Year calendar");
  $('nav-calendar').setAttribute('aria-current','page');
  const current = () => {const p=getNow();return customDate(p.year,p.month,p.day);};
  const query = new URLSearchParams(location.search).get('year');
  let year = query && validYear(Number(query)) ? Number(query) : current().year;
  // Currently selected day, or null.
  let selection = null;
  // dd.mm.yyyy. label of a UTC Date.
  const gregLabel = d => `${pad(d.getUTCDate(),2)}.${pad(d.getUTCMonth()+1,2)}.${pad(d.getUTCFullYear(),4)}.`;
  // Personal-calendar label yyyy.mmm.ddd.
  const dateLabel = (y,m,d) => `${pad(y,4)}.${pad(m)}.${pad(d)}`;
  // Mark a day as selected and show its Gregorian counterpart.
  function selectDay(month,day) {
    selection={month,day};
    for(const button of $('year-months').querySelectorAll('button[data-month]')) {
      button.setAttribute('aria-pressed',String(Number(button.dataset.month)===month && Number(button.dataset.day)===day));
    }
    const greg=gregorianDate(year,month,day);
    const extra=day===29 ? (month===1?t(" · prestupni dan"," · leap day"):t(" · dodatni godišnji dan"," · extra annual day")) : '';
    $('selected-date').textContent=`${WEEKDAYS[weekday(year,month,day)]} · ${dateLabel(year,month,day)} ↔ ${gregLabel(greg)}${extra}`;
  }
  // (Re)build the 13 month cards for the current year.
  function draw() {
    const today=current();
    $('year-input').value=String(year);
    $('year-title').textContent=String(year).padStart(4,'0');
    $('year-summary').textContent=isLeap(year)?t("366 dana · prvi i poslednji mesec imaju po 29 dana","366 days · first and final months have 29 days each"):t("365 dana · poslednji mesec ima 29 dana","365 days · final month has 29 days");
    $('year-prev').disabled=year===MIN_YEAR; $('year-next').disabled=year===MAX_YEAR;
    $('year-back1000').disabled=year-1000<MIN_YEAR; $('year-forward1000').disabled=year+1000>MAX_YEAR;
    $('year-back100').disabled=year-100<MIN_YEAR; $('year-forward100').disabled=year+100>MAX_YEAR;
    const cards=[];
    for(let month=1;month<=13;month++) {
      const days=monthLength(year,month),card=document.createElement('section');card.className='year-month';
      const top=document.createElement('div');top.className='panel-top';
      const title=document.createElement('h3');title.textContent=t(`Mesec ${pad(month)}`,`Month ${pad(month)}`);
      const count=document.createElement('span');count.textContent=t(`${days} dana`,`${days} days`);top.append(title,count);
      const range=document.createElement('p');range.className='month-range';range.textContent=`${gregLabel(gregorianDate(year,month,1))} — ${gregLabel(gregorianDate(year,month,days))}`;
      const grid=document.createElement('div');grid.className='calendar year-days';grid.append(...calendarPrefix(year,month));
      for(let day=1;day<=days;day++) {
        const button=document.createElement('button');button.type='button';button.textContent=pad(day,2);
        button.dataset.month=String(month);button.dataset.day=String(day);button.setAttribute('aria-pressed','false');
        const greg=gregLabel(gregorianDate(year,month,day));
        const extra=day===29?(month===1?t("Prestupni dan","Leap day"):t("Dan godine","Year day")):'';
        button.title=`${WEEKDAYS[weekday(year,month,day)]} · ${dateLabel(year,month,day)} · ${greg}${extra?' · '+extra:''}`;
        button.setAttribute('aria-label',t(`${WEEKDAYS[weekday(year,month,day)]}. Mesec ${month}, dan ${day}. Gregorijanski ${greg}${extra?' '+extra:''}`,`${WEEKDAYS[weekday(year,month,day)]}. Month ${month}, day ${day}. Gregorian ${greg}${extra?' '+extra:''}`));
        if(day===29)button.classList.add('extra-day');
        if(today.year===year && today.month===month && today.day===day){button.classList.add('active');button.setAttribute('aria-current','date');}
        button.addEventListener('click',()=>selectDay(month,day));grid.append(button);
      }
      const note=document.createElement('p');note.className='month-note';
      note.textContent=days===29?(month===1?t("＋ 29. dan: prestupni dan","＋ Day 29: leap day"):t("＋ 29. dan: Dan godine","＋ Day 29: year day")):t("Nedelja se nastavlja kroz mesece i godine","The week continues through months and years");
      card.append(top,range,grid,note);cards.push(card);
    }
    $('year-months').replaceChildren(...cards);
    if(selection && selection.day<=monthLength(year,selection.month))selectDay(selection.month,selection.day);
    else {selection=null;$('selected-date').textContent=t("Izaberi dan da vidiš odgovarajući gregorijanski datum.","Select a day to see its Gregorian date.");}
    $('calendar-today').textContent=t(`Danas · ${WEEKDAYS[weekday(today.year,today.month,today.day)]} · ${dateLabel(today.year,today.month,today.day)}`,`Today · ${WEEKDAYS[weekday(today.year,today.month,today.day)]} · ${dateLabel(today.year,today.month,today.day)}`);
  }
  // Switch year (if valid), reset selection, update ?year= in the address bar.
  function changeYear(next, updateHistory=true) {
    if(!validYear(next))return;
    year=next;selection=null;
    $('year-error').textContent='';
    if(updateHistory){const url=new URL(location.href);url.searchParams.set('year',String(year));history.replaceState(null,'',url);}
    draw();
  }
  // Year input: whole years 1..9999 only.
  $('year-form').addEventListener('submit',event=>{
    event.preventDefault();const value=$('year-input').value.trim();
    if(!/^\d{1,4}$/.test(value) || !validYear(Number(value))) {$('year-error').textContent=t("Unesi celu godinu od 1 do 9999.","Enter a whole year from 1 to 9999.");return;}
    changeYear(Number(value));
  });
  for(const [id,delta] of [['year-prev',-1],['year-next',1],['year-back100',-100],['year-forward100',100],['year-back1000',-1000],['year-forward1000',1000]]) {
    $(id).addEventListener('click',()=>changeYear(year+delta));
  }
  // 'Today' button: jump to the current year and select today.
  $('year-current').addEventListener('click',()=>{const c=current();changeYear(c.year);selectDay(c.month,c.day);});
  // Browser back/forward restores the year from the address.
  window.addEventListener('popstate',()=>{const value=Number(new URLSearchParams(location.search).get('year'));changeYear(validYear(value)?value:current().year,false);});
  draw();
  return {refresh:draw};
}
