// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Main page controller: decimal clock, Atlas stardate, ordinary-time comparison,
// monthly calendar, time-basis selector and server synchronisation.
// The annual calendar (/calendar) is the same page, driven by year.mjs.

import {t, lang, locale, WEEKDAYS, extraLabel} from './i18n.mjs';
import {DAY_MS, decimalTime, customDate, wallParts, pad, monthLength, weekday} from './clock.mjs';
import {initYearCalendar} from './year.mjs';
import {calendarPrefix} from './calendar-ui.mjs';
import {stardate} from './stardate.mjs';
const $ = id => document.getElementById(id);
// Selected time basis, remembered per browser in localStorage (never sent anywhere).
let zone = 'fixed1';
try { const saved = localStorage.getItem('atlas-clock-zone'); if (['fixed1','fixed2','utc','berlin'].includes(saved)) zone = saved; } catch {}
$('zone').value = zone;
const zones = {fixed1:t("UTC+01 · stalna zona","UTC+01 · fixed zone"),fixed2:t("UTC+02 · stalna zona","UTC+02 · fixed zone"),utc:t("UTC · stalna zona","UTC · fixed zone"),berlin:t("Europe/Berlin · lokalno","Europe/Berlin · local")};
// Time anchor: anchorEpoch (ms) was the true time when performance.now() read anchorPerf.
// now() adds the monotonic elapsed time, so the clock keeps running between syncs
// and ignores later changes of the device clock. rtt = round trip of the last sync.
let anchorEpoch = Date.now(), anchorPerf = performance.now(), syncAt = 0, rtt = 0, inFlight = false;
let chosenMonth = null, lastDate = '', lastSecond = '', lastFrame = -100;
const now = () => anchorEpoch + performance.now() - anchorPerf;
// Annual 13-month view; it does nothing unless the path is /calendar.
const yearView = initYearCalendar(() => wallParts(now(), zone));
// Refresh labels after the time basis changes and force a full redraw.
function updateZone() {
  $('zone-label').textContent = zones[zone];
  $('zone-note').textContent = zone === 'berlin' ? t("Pri pomeranju sata u martu i oktobru prikaz preskače ili ponavlja deo dana. Ti lokalni dani traju 23 ili 25 sadašnjih sati.","During clock changes in March and October, the display skips or repeats part of the day. These local days last 23 or 25 conventional hours.") : t("Svaki dan traje 24 sadašnja sata. Nema sezonskog pomeranja. Leti i zimi može postojati razlika prema Berlinu.","Each day lasts 24 conventional hours, with no seasonal changes. The offset from Berlin may differ between summer and winter.");
  lastDate = ''; lastSecond = ''; chosenMonth = null;
}
// Persist the chosen time basis.
$('zone').addEventListener('change', () => {zone=$('zone').value; try {localStorage.setItem('atlas-clock-zone',zone);} catch {} updateZone();});
// Draw one month of the personal calendar: weekday headings, aligned days,
// the extra 29th day, and a marker on today.
function renderCalendar(c) {
  const month = chosenMonth ?? (c.month || 13);
  $('month-title').textContent = t(`Mesec ${pad(month)} / 013`,`Month ${pad(month)} / 013`);
  $('prev-month').disabled = month === 1; $('next-month').disabled = month === 13;
  $('calendar').replaceChildren(...calendarPrefix(c.year,month), ...Array.from({length:monthLength(c.year,month)}, (_,i) => {const el=document.createElement('span'); el.textContent=pad(i+1,2); el.title=WEEKDAYS[weekday(c.year,month,i+1)]; if(i===28){el.classList.add('extra-day');el.title+=' · '+(month===1?t("Prestupni dan","Leap day"):t("Dan godine","Year day"));}if(c.month===month && c.day===i+1) {el.classList.add('active');el.setAttribute('aria-current','date');}return el;}));
  $('extra-days').textContent=monthLength(c.year,month)===29 ? (month===1?t("29. dan · prestupni dan prvog meseca","Day 29 · leap day in the first month"):t("29. dan · dodatni dan poslednjeg meseca","Day 29 · extra day in the final month")) : t("28 dana · neprekidna sedmodnevna nedelja","28 days · continuous seven-day week");
}
// Previous / next month buttons (clamped to months 1..13).
for (const [id,delta] of [['prev-month',-1],['next-month',1]]) $(id).addEventListener('click',()=>{const p=wallParts(now(),zone),c=customDate(p.year,p.month,p.day);chosenMonth=Math.max(1,Math.min(13,(chosenMonth??(c.month||13))+delta));renderCalendar(c);});
$('today').addEventListener('click',()=>{chosenMonth=null;lastDate='';});
// Redraw. The decimal digits update on every call; the ordinary clock, Berlin time and
// day bar once per second; the date and calendar only when the date changes.
function render() {
  const epoch=now(),p=wallParts(epoch,zone),c=customDate(p.year,p.month,p.day);
  const star=stardate(epoch);
  for(const [id,value] of [['star-display',star.display],['star-number',(lang==='sr'?star.number.replace('.',','):star.number)]]) {
    if($(id).textContent!==value)$(id).textContent=value;
  }
  decimalTime(p.ms).forEach((n,i)=>{const el=$(['dh','dm','ds','df'][i]); const value=pad(n);if(el.textContent!==value)el.textContent=value;});
  const secKey=`${p.year}-${p.month}-${p.day}-${p.hour}-${p.minute}-${p.second}`;
  if(secKey!==lastSecond){
    lastSecond=secKey;
    $('ordinary').textContent=[p.hour,p.minute,p.second].map(n=>pad(n,2)).join(':');
    $('ordinary-date').textContent=`${pad(p.day,2)}.${pad(p.month,2)}.${p.year}.`;
    const b=wallParts(epoch,'berlin');
    $('berlin').textContent=[b.hour,b.minute,b.second].map(n=>pad(n,2)).join(':');
    $('berlin').title=`${pad(b.day,2)}.${pad(b.month,2)}.${b.year}. Europe/Berlin`;
    $('day-bar').style.width=`${p.ms/DAY_MS*100}%`;
    $('day-percent').textContent=t(`${(p.ms/DAY_MS*100).toFixed(2).replace('.',',')} % DANA`,`${(p.ms/DAY_MS*100).toFixed(2)} % OF DAY`);
    $('year-progress').max=c.length; $('year-progress').value=c.ordinal-1+p.ms/DAY_MS;
    $('year-progress-label').textContent=t(`Dan ${c.ordinal} od ${c.length} · kalendarska godina`,`Day ${c.ordinal} of ${c.length} · calendar year`);
    if(syncAt && performance.now()-syncAt>120000){$('status').textContent=t("Čeka usklađivanje","Waiting for sync");$('status').className='live';}
  }
  const dateKey=`${p.year}-${p.month}-${p.day}`;
  if(dateKey!==lastDate){lastDate=dateKey;
    $('custom-date').textContent=`${c.year}.${pad(c.month)}.${pad(c.day)}`;
    $('date-description').textContent=t(`${WEEKDAYS[weekday(c.year,c.month,c.day)]} · godina ${c.year} · mesec ${c.month} · dan ${c.day}${c.extra?' · '+c.extra:''}`,`${WEEKDAYS[weekday(c.year,c.month,c.day)]} · year ${c.year} · month ${c.month} · day ${c.day}${c.extra?' · '+extraLabel(c.extra):''}`);
    $('year-type').textContent=c.length===366?t("PRESTUPNA · 366 DANA","LEAP YEAR · 366 DAYS"):t("365 DANA","365 DAYS");renderCalendar(c);
    yearView.refresh();
  }
}
// Ask /api/time three times and keep the sample with the smallest round trip, assuming
// the server stamped the time halfway through it (RTT/2 correction). If the server is
// unreachable the clock keeps running from the device time and says so on screen.
async function syncTime() {
  if(inFlight)return;
  inFlight=true;$('sync').disabled=true;
  try {
    let best=null;
    for(let i=0;i<3;i++) {
      const started=performance.now();
      const res=await fetch('/api/time',{cache:'no-store',signal:AbortSignal.timeout(4000)});
      if(!res.ok)throw Error(t("Server nije dostupan","Server unavailable"));
      const data=await res.json(),ended=performance.now();
      if(!Number.isFinite(data.unix_ms))throw Error(t("Nevažeće vreme","Invalid time"));
      const sample={epoch:data.unix_ms,mid:(started+ended)/2,rtt:ended-started};
      if(!best||sample.rtt<best.rtt)best=sample;
    }
    anchorEpoch=best.epoch;anchorPerf=best.mid;syncAt=performance.now();rtt=best.rtt;
    $('status').textContent=t("Usklađeno sa Atlasom","Synced with Atlas");$('status').className='live synced';
    const label=new Date(anchorEpoch).toLocaleTimeString(locale,{timeZone:'Europe/Berlin',hour12:false});
    $('sync-detail').textContent=t(`Poslednje usklađivanje: ${label} (Berlin). Odziv ${Math.round(rtt)} ms. Automatski na 60 s. Tačnost zavisi i od sistemskog sata servera.`,`Last sync: ${label} (Berlin). Round trip ${Math.round(rtt)} ms. Automatic every 60 s. Accuracy also depends on the server’s system clock.`);
  } catch {
    $('status').textContent=syncAt?t("Server nedostupan","Server unavailable"):t("Vreme uređaja","Device time");$('status').className='live';
    $('sync-detail').textContent=syncAt?t("Veza nije dostupna. Sat nastavlja od poslednjeg usklađivanja; ponovni pokušaj za najviše 60 s.","Connection unavailable. The clock continues from the last sync; retrying within 60 seconds."):t("Server nije dostupan. Prikazujemo vreme ovog uređaja do uspešnog usklađivanja.","Server unavailable. Showing this device’s time until synchronization succeeds.");
  } finally {inFlight=false;$('sync').disabled=false;render();}
}
$('sync').addEventListener('click',syncTime);
// Full-screen toggle.
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('fullscreen').textContent=t("Otvori preko celog ekrana u pregledaču","Use your browser’s full-screen mode");}catch{$('fullscreen').textContent=t("Ceo ekran nije dostupan","Full screen unavailable");}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?t("Izađi iz celog ekrana ↙","Exit full screen ↙"):t("Ceo ekran ↗","Full screen ↗");});
// When the tab becomes visible again, restart from the device time and resync at once.
document.addEventListener('visibilitychange',()=>{if(!document.hidden){anchorEpoch=Date.now();anchorPerf=performance.now();syncAt=0;$('status').textContent=t("Usklađivanje…","Syncing…");$('status').className='live';render();syncTime();}});
// Refresh from an absolute anchor; never count frames as elapsed time.
function frame(t){if(t-lastFrame>=30){render();lastFrame=t;}requestAnimationFrame(frame);}
// Start: draw once, schedule frames, sync now and then every 60 seconds.
updateZone();render();requestAnimationFrame(frame);syncTime();setInterval(syncTime,60000);
