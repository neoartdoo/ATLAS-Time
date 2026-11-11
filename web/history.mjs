// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// UI for /history: date input, conversion results and a small list of saved events.
// Saved events live only in this browser's localStorage (key below), never on the server.
// JSON export/import (format 'atlas-history-v1') is the backup path; at most 500 events.

import {t, locale, weekdayLabel, eraLabel, errorText} from './i18n.mjs';
import {convert, validateEvent, dateLabel} from './history-core.mjs';
const $=id=>document.getElementById(id),KEY='atlas-history-events-v1';
// Display names of the calendars.
const calendars={gregorian:t("gregorijanski","Gregorian"),julian:t("julijanski","Julian"),personal:t("lični","personal")};
// current = last successful conversion (input and result); events = saved list.
let current=null,events=[];
// Read the form into the input object expected by history-core.convert().
function readInput(){return {year:Number($('year').value),era:$('era').value,month:Number($('month').value),day:Number($('day').value),calendar:$('calendar').value,timeKnown:$('time-known').checked,hour:Number($('hour').value),minute:Number($('minute').value),second:Number($('second').value)};}
// Enable/disable the time fields and adjust limits and hints for the selected era/calendar.
function hints(){
  $('time-fields').disabled=!$('time-known').checked;
  $('year').min=$('era').value==='astro'?'-9999':'1';
  $('month').max=$('calendar').value==='personal'?'13':'12';
  $('era-hint').textContent=$('era').value==='astro'?t("Godina 0 = 1. p. n. e.; godina −1 = 2. p. n. e.","Year 0 = 1 BCE; year −1 = 2 BCE."):t("Ovde nema godine 0. Unesi pozitivan broj godine u izabranoj eri.","There is no year 0 here. Enter a positive year number in your chosen era.");
}
// Convert the form values and show the results, or show a translated error.
function doConvert(){
  try{
    for(const id of ['year','month','day',...($('time-known').checked?['hour','minute','second']:[])])if(!$(id).value.trim())throw Error(t("Popuni datum i poznato vreme.","Complete the date and any known time fields."));
    const input=readInput(),r=convert(input);current={input,result:r};
    $('personal-date').textContent=dateLabel(r.personal,true);
    $('personal-era').textContent=t(`${eraLabel(r.personal.year)} · astronomska oznaka godine ${r.personal.year}`,`${eraLabel(r.personal.year)} · astronomical year number ${r.personal.year}`);
    $('weekday').textContent=weekdayLabel(r.weekday);
    $('greg-date').textContent=`${dateLabel(r.gregorian)} · ${eraLabel(r.gregorian.year)}`;
    $('jul-date').textContent=`${dateLabel(r.julian)} · ${eraLabel(r.julian.year)}`;
    $('source-ordinal').textContent=t(`${r.ordinal}. dan (${r.ordinal-1} proteklih)`,`Day ${r.ordinal} (${r.ordinal-1} elapsed)`);
    $('target-ordinal').textContent=t(`${r.personalOrdinal}. dan`,`Day ${r.personalOrdinal}`);
    $('decimal-time').textContent=r.decimal?r.decimal.map(n=>String(n).padStart(3,'0')).join('.'):t("Nije poznato","Unknown");
    $('time-note').textContent=r.decimal?t("Ista vremenska osnova; promenjene su samo jedinice. Nije uračunata istorijska vremenska zona.","Same time basis; only the units have changed. No historical time zone has been applied."):t("Za ovaj događaj ne pretpostavljamo sat, minut ni sekundu.","We do not assume an hour, minute or second for this event.");
    $('epoch-days').textContent=t(`${r.daysFromEpoch.toLocaleString('sr-Latn-RS')} dana od 01.01.0001. JDN oznaka građanskog datuma: ${r.jdn}.`,`${r.daysFromEpoch.toLocaleString(locale)} days since 1 January 0001. Civil-date JDN label: ${r.jdn}.`);
    $('conversion-note').textContent=t(`Izvor tumačimo kao ${calendars[input.calendar]} datum. Prikazana godina je astronomska; istorijska oznaka ere je dopisana. ${input.calendar==='julian'?t("Sačuvan je isti stvarni dan, iako se oznaka datuma i redni dan godine razlikuju.","The same real day is preserved, even though its date label and day of the year differ."):''}`,`Source interpreted as a ${calendars[input.calendar]} date. The displayed year uses astronomical numbering, with a historical era label alongside. ${input.calendar==='julian'?t("Sačuvan je isti stvarni dan, iako se oznaka datuma i redni dan godine razlikuju.","The same real day is preserved, even though its date label and day of the year differ."):''}`);
    document.querySelector('.results-panel').classList.remove('stale');$('error').textContent='';
  }catch(error){current=null;$('error').textContent=errorText(error);document.querySelector('.results-panel').classList.add('stale');}
}
// Fill the form from an input object (examples and saved events) and convert.
function loadInput(input){
  for(const id of ['year','era','month','day','calendar','hour','minute','second'])$(id).value=String(input[id]??0);
  $('time-known').checked=!!input.timeKnown;hints();doConvert();
}
$('convert-form').addEventListener('submit',e=>{e.preventDefault();doConvert();});
// Any edit marks the shown result as stale until the user converts again.
$('convert-form').addEventListener('input',()=>{hints();current=null;document.querySelector('.results-panel').classList.add('stale');$('error').textContent=t("Unos je promenjen — klikni „Preračunaj datum“.","Input changed — click “Convert date”.");});
// Example buttons (including the 1582 Julian/Gregorian reform gap).
for(const [id,year,month,day,calendar] of [['example-greg',1369,7,13,'gregorian'],['example-jul',1369,7,13,'julian'],['example-reform',1582,10,4,'julian'],['example-zero',0,1,1,'gregorian']]){
  $(id).addEventListener('click',()=>loadInput({year,month,day,calendar,era:'astro',timeKnown:false,hour:12,minute:0,second:0}));
}
// Persist the list to localStorage; reports failure instead of losing data silently.
function writeEvents(next){
  try{localStorage.setItem(KEY,JSON.stringify(next));events=next;renderEvents();return true;}
  catch{$('event-status').textContent=t("Čuvanje u pregledaču nije uspelo. Proveri dozvole i slobodan prostor.","Could not save in the browser. Check permissions and available storage.");return false;}
}
// List events sorted by date, with 'open' and 'remove' buttons.
function renderEvents(){
  const list=$('event-list');list.replaceChildren();
  if(!events.length){const p=document.createElement('p');p.className='note';p.textContent=t("Još nema sačuvanih događaja.","No saved events yet.");list.append(p);return;}
  for(const event of [...events].sort((a,b)=>convert(a.input).jdn-convert(b.input).jdn)){
    const r=convert(event.input),row=document.createElement('article');row.className='event-row';
    const title=document.createElement('h3');title.textContent=event.name;
    const date=document.createElement('p');date.textContent=t(`${dateLabel(r.personal,true)} · ${r.weekday} | izvor: ${event.input.day}.${event.input.month}.${event.input.year} (${calendars[event.input.calendar]}, ${event.input.era==='astro'?t("astronomski","astronomical"):event.input.era==='bce'?t("p. n. e.","BCE"):t("n. e.","CE")})${r.decimal?' | '+r.decimal.map(n=>String(n).padStart(3,'0')).join('.'):''}`,`${dateLabel(r.personal,true)} · ${weekdayLabel(r.weekday)} | source: ${event.input.day}.${event.input.month}.${event.input.year} (${calendars[event.input.calendar]}, ${event.input.era==='astro'?t("astronomski","astronomical"):event.input.era==='bce'?t("p. n. e.","BCE"):t("n. e.","CE")})${r.decimal?' | '+r.decimal.map(n=>String(n).padStart(3,'0')).join('.'):''}`);
    const note=document.createElement('p');note.textContent=event.note;
    const actions=document.createElement('div');actions.className='event-controls';
    const open=document.createElement('button');open.textContent=t("Otvori datum","Open date");open.addEventListener('click',()=>{loadInput(event.input);$('event-name').value=event.name;$('event-note').value=event.note;$('convert-form').scrollIntoView({behavior:'smooth'});});
    const remove=document.createElement('button');remove.textContent=t("Ukloni","Remove");remove.setAttribute('aria-label',t(`Ukloni događaj ${event.name}`,`Remove event ${event.name}`));remove.addEventListener('click',()=>{if(writeEvents(events.filter(e=>e!==event)))$('event-status').textContent=t("Događaj je uklonjen.","Event removed.");});
    actions.append(open,remove);row.append(title,date,note,actions);list.append(row);
  }
}
// Save the current conversion as a named event (validated, max 500).
$('save-form').addEventListener('submit',e=>{
  e.preventDefault();
  try{
    if(!current)throw Error(t("Prvo preračunaj važeći datum.","Convert a valid date first."));
    if(events.length>=500)throw Error(t("Najviše 500 događaja. Izvezi kopiju pre uklanjanja starih zapisa.","Maximum 500 events. Export a backup before removing old entries."));
    const event=validateEvent({name:$('event-name').value,note:$('event-note').value,input:current.input});
    if(writeEvents([...events,event]))$('event-status').textContent=t(`Sačuvano: ${event.name}`,`Saved: ${event.name}`);
  }catch(error){$('event-status').textContent=errorText(error);}
});
// Download all events as JSON.
$('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({format:'atlas-history-v1',events},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='atlas-personal-time-events.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
// Import a JSON file (max 2 MB). Events are added; existing ones are never deleted.
$('import').addEventListener('change',async()=>{
  try{
    const file=$('import').files[0];if(!file)return;
    if(file.size>2000000)throw Error(t("Fajl je prevelik; maksimum je 2 MB.","File too large; the limit is 2 MB."));
    const data=JSON.parse(await file.text());
    if(data.format!=='atlas-history-v1'||!Array.isArray(data.events)||data.events.length+events.length>500)throw Error(t("Nevažeći format ili više od 500 događaja.","Invalid format or more than 500 events."));
    const incoming=data.events.map(validateEvent);
    if(writeEvents([...events,...incoming]))$('event-status').textContent=t(`Dodato ${incoming.length} događaja. Postojeći zapisi su sačuvani.`,`Added ${incoming.length} events. Existing entries were preserved.`);
  }catch(error){$('event-status').textContent=t(`Uvoz nije uspeo: ${errorText(error)}`,`Import failed: ${errorText(error)}`);}
  finally{$('import').value='';}
});
// Load saved events at startup; if the stored data is damaged, say so and block saving.
try{const raw=localStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);if(!Array.isArray(data)||data.length>500)throw Error();events=data.map(validateEvent);}}
catch{$('event-status').textContent=t("Prethodni zapisi nisu učitani. Proveri backup pre čuvanja novih.","Previous entries could not be loaded. Check your backup before saving new ones.");$('save-form').querySelector('button').disabled=true;$('import').disabled=true;}
hints();doConvert();renderEvents();
