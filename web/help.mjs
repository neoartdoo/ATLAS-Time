// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
//
// Behaviour of the /help page: print button and the time-measurement diagnostic.

import {t, errorText} from './i18n.mjs';
const $=id=>document.getElementById(id);
// Open the browser print dialog.
$('help-print').addEventListener('click',()=>window.print());
// 'Measure three samples': ask /api/time three times and show the smallest round trip,
// half of it (a rough one-way estimate), the server-minus-device offset and the server's
// UTC time. This is not an NTP diagnostic and it changes no clock.
$('help-measure').addEventListener('click',async()=>{
  $('help-measure').disabled=true;
  $('help-measure-status').textContent=t("Uzimamo tri uzorka vremena sa Atlasa…","Taking three time samples from Atlas…");
  for(const id of ['help-rtt','help-offset','help-server-time','help-half-rtt'])$(id).textContent='—';
  try{
    let best=null;
    for(let i=0;i<3;i++){
      const local=Date.now(),start=performance.now();
      const response=await fetch('/api/time',{cache:'no-store',signal:AbortSignal.timeout(4000)});
      if(!response.ok)throw Error(t("Server nije dostupan.","Server unavailable."));
      const value=await response.json(),end=performance.now();
      if(!Number.isFinite(value.unix_ms))throw Error(t("Server nije vratio važeće vreme.","The server did not return a valid time."));
      const rtt=end-start,sample={rtt,offset:value.unix_ms-(local+rtt/2),epoch:value.unix_ms};
      if(!best||rtt<best.rtt)best=sample;
    }
    $('help-rtt').textContent=`${best.rtt.toFixed(2)} ms`;
    $('help-half-rtt').textContent=`${(best.rtt/2).toFixed(2)} ms`;
    $('help-offset').textContent=`${best.offset>=0?'+':''}${best.offset.toFixed(2)} ms`;
    $('help-server-time').textContent=new Date(best.epoch).toISOString();
    $('help-measure-status').textContent=t("Završeno. Plus znači da server prednjači u odnosu na ovaj uređaj. Ovo nije merenje greške prema NTP-u, atomskom vremenu ili Zemljinoj orbiti.","Done. A plus sign means the server is ahead of this device. This does not measure error against NTP, atomic time or Earth’s orbit.");
  }catch(error){$('help-measure-status').textContent=t(`Merenje nije uspelo: ${errorText(error)}`,`Measurement failed: ${errorText(error)}`);}
  finally{$('help-measure').disabled=false;}
});
