import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {backendTestFiles,runBackendTests} from './run-backend-tests.mjs';
async function fixture(t,files){const root=await mkdtemp(join(tmpdir(),'beyond-backend-runner-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const name of files){const path=join(root,name);await mkdir(join(path,'..'),{recursive:true});await writeFile(path,'');}return root;}
test('discovers every nested Bun test naming form and retains production compatibility last',async t=>{
 const root=await fixture(t,['discovery-security.test.ts','nested/a.spec.js','nested/b_test.ts','nested/c_spec.tsx','fixture.json','deployed-compatibility.test.ts']);
 assert.deepEqual((await backendTestFiles(root)).map(p=>p.slice(root.length+1)),['discovery-security.test.ts','nested/a.spec.js','nested/b_test.ts','nested/c_spec.tsx','deployed-compatibility.test.ts']);
});
test('executes every suite once even after failures and does not hide failed or terminated processes',async t=>{
 const root=await fixture(t,['a.test.ts','b.test.ts','c.test.ts','d.test.ts']),seen=[];
 const result=await runBackendTests({root,log(){},run:async file=>{seen.push(file);return seen.length===1?{status:1}:seen.length===2?{status:null,signal:'SIGTERM'}:seen.length===3?{error:new Error('spawn failed')}: {status:0};}});
 assert.deepEqual(seen,result.files);assert.equal(new Set(seen).size,4);assert.equal(result.failures.length,3);assert.equal(result.exitCode,1);
});
test('reports success only after every process succeeds',async t=>{
 const root=await fixture(t,['a.test.ts','b.test.ts']);let count=0;const result=await runBackendTests({root,log(){},run(){count++;return{status:0};}});
 assert.equal(count,2);assert.deepEqual(result.failures,[]);assert.equal(result.exitCode,0);
});
test('a thrown process error still runs remaining suites and fails the aggregate',async t=>{
 const root=await fixture(t,['a.test.ts','b.test.ts']);let count=0;const result=await runBackendTests({root,log(){},run(){if(++count===1)throw Error('unavailable');return{status:0};}});
 assert.equal(count,2);assert.equal(result.failures.length,1);assert.equal(result.exitCode,1);
});
test('an empty backend directory cannot silently pass',async t=>{
 const root=await fixture(t,[]);await assert.rejects(runBackendTests({root,log(){}}),/No backend test suites/);
});
