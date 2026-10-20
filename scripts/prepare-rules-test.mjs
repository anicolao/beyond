import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
/** Cold compiler/database startup belongs to emulator readiness. The real
 * beforeAll hook still installs these exact rules within its unchanged5s
 * budget; no gameplay assertion, retry, identity or data write moves here. */
export async function prepareRulesTest({host=process.env.FIRESTORE_EMULATOR_HOST??'127.0.0.1:8197',request=fetch,rules}={}){
 if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))throw new Error('Rules readiness requires a local isolated emulator.');
 const port=Number(host.split(':')[1]);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid isolated emulator port.');
 const source=rules??await readFile('firestore.rules','utf8');
 const uploaded=await request(`http://${host}/emulator/v1/projects/demo-beyond:securityRules`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:{files:[{content:source}]}}),signal:AbortSignal.timeout(10_000)});
 if(!uploaded.ok)throw new Error(`Rules compiler readiness failed (${uploaded.status}).`);
 const denied=await request(`http://${host}/v1/projects/demo-beyond/databases/(default)/documents/invites/_connection`,{signal:AbortSignal.timeout(10_000)});
 const result=await denied.json();if(denied.status!==403||result.error?.status!=='PERMISSION_DENIED')throw new Error('Rules readiness did not prove unauthenticated-get denial.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await prepareRulesTest();console.log('Exact source rules compiler and unauthenticated-get denial ready; backend test budgets unchanged.');}
