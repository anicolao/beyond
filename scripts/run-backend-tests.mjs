import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

/** Keep every backend test and its original Bun test/hook deadlines. A fresh
 * process releases each suite's SDK clients before the next suite starts;
 * no emulator data, identities or exact installed rules are reset here. */
export async function backendTestFiles(root='tests/backend'){
 const files=[];
 async function visit(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
   const path=join(directory,entry.name);
   if(entry.isDirectory()&&entry.name!=='node_modules')await visit(path);
   else if(entry.isFile()&&/[._](test|spec)\.[cm]?[jt]sx?$/.test(entry.name))files.push(path);
  }
 }
 await visit(root);
 // Exercise frozen production compatibility after the full current-source load,
 // including discovery security. Moving it earlier must not conceal a failure.
 return files.sort((a,b)=>Number(a.endsWith('deployed-compatibility.test.ts'))-Number(b.endsWith('deployed-compatibility.test.ts'))||a.localeCompare(b));
}
export async function runBackendTests({root='tests/backend',run=(file)=>spawnSync('bun',['test',file],{stdio:'inherit'}),log=console.log}={}){
 const files=await backendTestFiles(root);if(!files.length)throw new Error('No backend test suites discovered.');
 const failures=[];
 for(const file of files){
  log(`Backend suite in fresh process: ${file}`);
  try{const result=await run(file);if(result.error||result.signal||result.status!==0)failures.push(file);}
  catch(error){log(`Backend suite process failed: ${file}: ${error.message}`);failures.push(file);}
 }
 log(`Backend suites: ${files.length} executed; ${failures.length} failed.`);
 return {files,failures,exitCode:failures.length?1:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{process.exitCode=(await runBackendTests()).exitCode;}
 catch(error){console.error(error);process.exitCode=1;}
}
