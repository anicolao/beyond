import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
/** Serialize initial database compilation with exact-source readback/upload.
 * Skip compilation only after proving identical installed source bytes. All startup requests share10s; test/hook5s budgets are unchanged. */
export async function prepareRulesTest({host=process.env.FIRESTORE_EMULATOR_HOST??'127.0.0.1:8197',request=fetch,rules}={}){
 if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))throw new Error('Rules readiness requires a local isolated emulator.');
 const port=Number(host.split(':')[1]);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid isolated emulator port.');
 const source=rules??await readFile('firestore.rules','utf8'),deadline=performance.now()+10_000;
 function remaining(){const value=Math.floor(deadline-performance.now());if(value<=0)throw new Error('Rules readiness exceeded its shared10s startup deadline.');return value;}
 async function send(url,options,phase){
  try{const response=await request(url,{...options,signal:AbortSignal.timeout(remaining())});remaining();return response;}
  catch(error){throw new Error(`Rules readiness ${phase} failed within the shared10s startup deadline.`,{cause:error});}
 }
 async function denial(phase){
  const response=await send(`http://${host}/v1/projects/demo-beyond/databases/(default)/documents/invites/_connection`,{},phase);
  const result=await response.json();remaining();
  if(response.status!==403||result.error?.status!=='PERMISSION_DENIED')throw new Error('Rules readiness did not prove unauthenticated-get denial.');
 }
 // The CLI can open the port before the --rules database initialization finishes.
 // A read settles that work before a second compiler request, without creating data.
 await denial('initial denial');
 async function exactInstalled(){
  const response=await send(`http://${host}/emulator/v1/projects/demo-beyond:securityRules`,{},'exact-source readback');
  if(!response.ok)throw new Error(`Rules source readback failed (${response.status}).`);
  const result=await response.json();remaining();
  return result.rules?.files?.length===1&&result.rules.files[0].content===source&&!(result.issues??[]).some(issue=>issue.severity==='ERROR');
 }
 // The CLI already loads this exact source. Prove equality instead of asking
 // its cold compiler to compile the same large scope tree a second time.
 if(!await exactInstalled()){
  const uploaded=await send(`http://${host}/emulator/v1/projects/demo-beyond:securityRules`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:{files:[{content:source}]}})},'exact-source upload');
  if(!uploaded.ok)throw new Error(`Rules compiler readiness failed (${uploaded.status}).`);
  if(!await exactInstalled())throw new Error('Rules source readback does not match the exact current source.');
 }
 await denial('current-source denial');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await prepareRulesTest();console.log('Serialized exact source compiler and unauthenticated-get denial ready; backend test budgets unchanged.');}
