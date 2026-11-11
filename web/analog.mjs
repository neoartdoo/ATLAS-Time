// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Analog decimal clock with five hands (/analog): tens and units of hours, tens and
// units of minutes, and a smooth seconds hand. Digit hands jump exactly to 0..9.

import {t} from './i18n.mjs';
import {wallParts} from './clock.mjs';
import {analogHands,EXAMPLE_MS} from './analog-core.mjs';
// handIds = SVG element ids of the hands, in the order of the angles from analog-core.mjs.
const $=id=>document.getElementById(id),handIds=['hand-h10','hand-h1','hand-m10','hand-m1','hand-sec'];
// Page state: time basis, example mode, highlighted hand, time anchor (see app.mjs), busy flag.
let zone='fixed1',demo=false,selected=null,anchor=Date.now(),anchorPerf=performance.now(),busy=false,hasSynced=false,lastLabel='';
// The time basis is shared with the other pages through localStorage.
try{const saved=localStorage.getItem('atlas-clock-zone');if(['utc','fixed1','fixed2','berlin'].includes(saved))zone=saved;}catch{}
$('analog-zone').value=zone;
const now=()=>anchor+performance.now()-anchorPerf;
// Update the explanation under the zone selector and the label on the dial.
function zoneNote(){
  $('analog-zone-note').textContent=zone==='berlin'?t("Berlin prati letnje/zimsko vreme; sat tada preskoči ili ponovi jedan sadašnji sat.","Berlin observes daylight saving; the clock then skips or repeats one conventional hour."):t("Stalna zona: dan uvek traje 24 sadašnja sata, bez letnjeg pomeranja.","Fixed zone: each day lasts 24 conventional hours, with no daylight saving changes.");
  $('face-zone').textContent=demo?t("PRIMER · ZAUSTAVLJEN","EXAMPLE · PAUSED"):{utc:'UTC',fixed1:t("UTC+01 · stalno","UTC+01 · fixed"),fixed2:t("UTC+02 · stalno","UTC+02 · fixed"),berlin:'Europe/Berlin'}[zone];
}
// Switch between live time and the frozen 57:24:12 example.
function mode(value){demo=value;lastLabel='';$('mode-live').setAttribute('aria-pressed',String(!demo));$('mode-demo').setAttribute('aria-pressed',String(demo));zoneNote();render();}
$('mode-live').addEventListener('click',()=>{mode(false);sync();});
$('mode-demo').addEventListener('click',()=>mode(true));
// Persist the chosen time basis (shared with the other pages).
$('analog-zone').addEventListener('change',()=>{zone=$('analog-zone').value;try{localStorage.setItem('atlas-clock-zone',zone);}catch{}zoneNote();lastLabel='';render();});
// Show/hide the seconds hand.
$('show-seconds').addEventListener('change',()=>{$('hand-sec').style.display=$('show-seconds').checked?'':'none';});
// Legend: click a hand to highlight it and dim the others; click again to reset.
for(const button of document.querySelectorAll('[data-hand]'))button.addEventListener('click',()=>{
  selected=selected===button.dataset.hand?null:button.dataset.hand;
  for(const id of handIds)$(id).classList.toggle('dimmed',!!selected && selected!==id);
  for(const b of document.querySelectorAll('[data-hand]'))b.setAttribute('aria-pressed',String(b.dataset.hand===selected));
});
// Rotate every hand to its angle and refresh the screen-reader label and digital helper text.
function render(){
  const p=wallParts(now(),zone),value=analogHands(demo?EXAMPLE_MS:p.ms);
  value.angles.forEach((angle,i)=>$(handIds[i]).setAttribute('transform',`rotate(${angle} 260 260)`));
  $('hands').setAttribute('visibility','visible');
  const key=`${demo}-${value.hours}-${value.minutes}-${value.seconds}`;
  if(key!==lastLabel){lastLabel=key;
    $('analog-face').setAttribute('aria-label',t(`${demo?t("Zaustavljen primer","Paused example"):t("Uživo","Live")}: ${value.hours} novih sati, ${value.minutes} novih minuta i ${value.seconds} novih sekundi. Četiri kazaljke pokazuju cifre ${value.digits.join(', ')}.`,`${demo?t("Zaustavljen primer","Paused example"):t("Uživo","Live")}: ${value.hours} new hours, ${value.minutes} new minutes and ${value.seconds} new seconds. Four hands show the digits ${value.digits.join(', ')}.`));
    $('analog-digital').textContent=[value.hours,value.minutes,value.seconds].map(n=>String(n).padStart(3,'0')).join('.');
    $('analog-ordinary').textContent=demo?t("Primer je zaustavljen na 57 sati, 24 minuta i 12 sekundi.","The example is paused at 57 hours, 24 minutes and 12 seconds."):t(`Sadašnji sat u istoj zoni: ${[p.hour,p.minute,p.second].map(n=>String(n).padStart(2,'0')).join(':')}`,`Conventional clock in the same zone: ${[p.hour,p.minute,p.second].map(n=>String(n).padStart(2,'0')).join(':')}`);
  }
}
// Same three-sample, smallest-round-trip synchronisation as app.mjs.
async function sync(){
  if(busy)return;busy=true;$('analog-sync').disabled=true;
  try{
    let best=null;
    for(let i=0;i<3;i++){
      const start=performance.now(),res=await fetch('/api/time',{cache:'no-store',signal:AbortSignal.timeout(4000)});
      if(!res.ok)throw Error();const data=await res.json(),end=performance.now();
      if(!Number.isFinite(data.unix_ms))throw Error();
      if(!best||end-start<best.rtt)best={epoch:data.unix_ms,mid:(start+end)/2,rtt:end-start};
    }
    anchor=best.epoch;anchorPerf=best.mid;hasSynced=true;
    $('analog-status').textContent=t("Usklađeno sa Atlasom","Synced with Atlas");$('analog-status').className='live synced';
    $('analog-sync-note').textContent=t(`Usklađivanje na 60 s · odziv ${Math.round(best.rtt)} ms. Tačnost prati sistemski sat servera.`,`Sync every 60 s · round trip ${Math.round(best.rtt)} ms. Accuracy follows the server’s system clock.`);
  }catch{
    $('analog-status').textContent=hasSynced?t("Server nedostupan","Server unavailable"):t("Vreme uređaja","Device time");$('analog-status').className='live';
    $('analog-sync-note').textContent=hasSynced?t("Sat nastavlja od poslednjeg usklađivanja. Ponovni pokušaj za najviše 60 s.","The clock continues from the last sync. Retrying within 60 seconds."):t("Koristimo trenutno vreme uređaja dok server nije dostupan.","Using the device’s current time while the server is unavailable.");
  }finally{busy=false;$('analog-sync').disabled=false;render();}
}
$('analog-sync').addEventListener('click',sync);
$('analog-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('analog-fullscreen').textContent=t("Ceo ekran nije podržan","Full screen not supported");}catch{$('analog-fullscreen').textContent=t("Ceo ekran nije dostupan","Full screen unavailable");}});
document.addEventListener('fullscreenchange',()=>{$('analog-fullscreen').textContent=document.fullscreenElement?t("Izađi iz celog ekrana","Exit full screen"):t("Ceo ekran ↗","Full screen ↗");});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){anchor=Date.now();anchorPerf=performance.now();hasSynced=false;$('analog-status').textContent=t("Usklađivanje…","Syncing…");$('analog-status').className='live';sync();render();}});
let lastFrame=-100;
// Animation loop (about 60 fps, paused while the tab is hidden).
function frame(t){if(!document.hidden&&t-lastFrame>=16){render();lastFrame=t;}requestAnimationFrame(frame);}
// Start: draw, schedule frames, sync now and every 60 seconds.
zoneNote();render();requestAnimationFrame(frame);sync();setInterval(sync,60000);
