import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
for(const language of ['en','sr'])for(const page of ['index','calendar','history','analog','analog3','help']){
 test(`${language}: ${page} messages, behavior and saved data`,()=>{
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('./ui-language-fixture.mjs',import.meta.url)),language,page],{encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
 });
}
