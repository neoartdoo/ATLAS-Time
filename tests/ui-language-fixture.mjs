// A small DOM test double for module interactions, not a visual browser test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const [language,page] = process.argv.slice(2);
const en=language==='en';
const file=page==='calendar'?'index':page;
const html=readFileSync(new URL(`../web/${en?'en/':''}${file}.html`,import.meta.url),'utf8');
class Element {
  constructor(tag='div'){this.tagName=tag;this.textContent='';this.value='';this.children=[];this.dataset={};this.style={};this.attributes={};this.listeners={};this.classList={add(){},remove(){},toggle(){}};}
  addEventListener(name,fn){this.listeners[name]=fn;}
  setAttribute(name,value){this.attributes[name]=value;}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  querySelectorAll(selector){const all=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);return selector==='button[data-month]'?all.filter(c=>c.tagName==='button'&&c.dataset.month):all;}
  querySelector(){return new Element('button');}
  scrollIntoView(){}
  async fire(name){return this.listeners[name]?.({preventDefault(){}});}
}
const nodes=new Map();
for(const m of html.matchAll(/<([a-z0-9]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
 const el=new Element(m[1]);el.value=m[0].match(/\bvalue="([^"]*)"/)?.[1]??'';nodes.set(m[2],el);
}
const $=id=>{assert.ok(nodes.has(id),`missing DOM id ${id}`);return nodes.get(id);};
const links=[{href:'http://atlas/calendar?year=2024'},{href:'http://atlas/help'},{href:'http://atlas/health'}];
const docListeners={};
globalThis.document={documentElement:{lang:en?'en':'sr-Latn'},body:new Element(),hidden:false,cookie:'',getElementById:id=>nodes.get(id)??null,createElement:tag=>new Element(tag),querySelector:selector=>String(selector).startsWith('link[rel="alternate"]')?null:new Element(),querySelectorAll:sel=>sel.startsWith('a[')?links:[],addEventListener:(n,f)=>docListeners[n]=f};
globalThis.location=new URL(`http://atlas/${page==='index'?'':page==='analog3'?'analog-3':page}?year=2024&lang=${language}#top`);
let redirected;location.assign=url=>{redirected=new URL(url);};
globalThis.window={addEventListener(){},print(){}};
globalThis.history={replaceState(_a,_b,url){globalThis.location=new URL(url);}};
const storedEvent={name:'Četvrtak / My event',note:'Izvor: knjiga <tag>',input:{year:1985,era:'astro',month:4,day:26,calendar:'gregorian',timeKnown:false,hour:12,minute:0,second:0}};
const storage=new Map([['atlas-clock-zone','utc'],['atlas-history-events-v1',JSON.stringify([storedEvent])]]);
let writes=0;
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>{writes++;storage.set(k,v);}};
globalThis.requestAnimationFrame=()=>{};
globalThis.setInterval=()=>{};
const stamp=Date.UTC(2024,0,29,12);
Date.now=()=>stamp;
globalThis.performance={now:()=>10};
globalThis.fetch=async()=>({ok:true,json:async()=>({unix_ms:stamp})});
if(page==='history'){$('calendar').value='gregorian';$('era').value='astro';$('time-known').checked=false;}
const moduleName=page==='index'||page==='calendar'?'app':page;
await import(`../web/${moduleName}.mjs`);
await new Promise(resolve=>setImmediate(resolve));
assert.equal($('language').value,language);
assert.equal(writes,0,'opening a translated page must not rewrite saved data');
assert.equal(storage.get('atlas-history-events-v1'),JSON.stringify([storedEvent]));
if(page==='index'||page==='calendar'){
 assert.equal($('dh').textContent,'050');assert.equal($('dm').textContent,'000');
 assert.match($('date-description').textContent,en?/Monday.*Leap day/:/Ponedeljak.*Prestupni dan/);
 assert.match($('status').textContent,en?/Synced with Atlas/:/Usklađeno sa Atlasom/);
 assert.match($('star-number').textContent,en?/\.500000$/:/,500000$/);
 if(page==='calendar'){
  assert.equal($('year-months').children.length,13);
  const days=$('year-months').querySelectorAll('button[data-month]');assert.equal(days.length,366);
  await days[28].fire('click');assert.match($('selected-date').textContent,en?/leap day/:/prestupni dan/);
  $('year-input').value='0';await $('year-form').fire('submit');assert.match($('year-error').textContent,en?/whole year/:/celu godinu/);
 }
}else if(page==='history'){
 assert.equal($('personal-date').textContent,'1369.007.026');
 assert.match($('epoch-days').textContent,en?/499,845 days/:/499\.845 dana/);
 const row=$('event-list').children[0];assert.equal(row.children[0].textContent,storedEvent.name);assert.equal(row.children[2].textContent,storedEvent.note);
 assert.match(row.children[1].textContent,en?/Friday.*source:/:/Petak.*izvor:/);
 $('day').value='32';await $('convert-form').fire('submit');assert.match($('error').textContent,en?/does not exist/:/ne postoji/);
 await $('example-zero').fire('click');assert.match($('personal-era').textContent,en?/1 BCE/:/1\. p\. n\. e\./);
 $('import').files=[{size:100,text:async()=>'{broken'}];await $('import').fire('change');assert.match($('event-status').textContent,en?/not valid JSON/:/nije važeći JSON/);
 $('import').files=[{size:100,text:async()=>JSON.stringify({format:'atlas-history-v1',events:[storedEvent]})}];await $('import').fire('change');
 assert.deepEqual(JSON.parse(storage.get('atlas-history-events-v1')),[storedEvent,storedEvent]);
}else if(page==='analog'||page==='analog3'){
 await $('mode-demo').fire('click');assert.equal($('analog-digital').textContent,'057.024.012');
 assert.match($('analog-face').attributes['aria-label'],en?/Paused example.*57 new hours/:/Zaustavljen primer.*57 novih sati/);
 assert.match($('analog-status').textContent,en?/Synced/:/Usklađeno/);
}else if(page==='help'){
 await $('help-measure').fire('click');assert.match($('help-measure-status').textContent,en?/Done\./:/Završeno\./);
 globalThis.fetch=async()=>{throw new TypeError('Network error');};
 await $('help-measure').fire('click');assert.match($('help-measure-status').textContent,en?/Measurement failed/:/Merenje nije uspelo/);
}
const target=en?'sr':'en';$('language').value=target;await $('language').fire('change');
assert.match(document.cookie,new RegExp(`atlas_lang=${target}; Path=/; Max-Age=31536000; SameSite=Lax`));
assert.equal(redirected.searchParams.get('year'),'2024');assert.equal(redirected.searchParams.get('lang'),target);assert.equal(redirected.hash,'#top');
assert.equal(new URL(links[1].href).searchParams.get('lang'),language);assert.equal(new URL(links[2].href).searchParams.get('lang'),null);
console.log(`${language} ${page}: language, interactions and preserved data OK`);
