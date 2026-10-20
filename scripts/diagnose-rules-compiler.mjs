import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';
/** Read-only Rules :test requests. No release/ruleset/auth/data write and no
 * fallback deployment. Report only public source hashes and response status;
 * never serialize an authenticated request or its exception. */
export async function compareRuleCompilers({request,sources}){
 const reports=[];
 for(const {name,content}of sources){
  const identity={name,bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex')};
  try{const response=await request({source:{files:[{name:'firestore.rules',content}]}});reports.push({...identity,status:response.status,issueSeverities:(response.data?.issues??[]).map(issue=>issue.severity)});}
  catch(error){reports.push({...identity,status:error.response?.status??null,issueSeverities:[]});}
 }
 return reports;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {GoogleAuth}=await import('google-auth-library');const client=await new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient();
 const sources=await Promise.all([['current','firestore.rules'],['frozen-deployed-PR5','tests/backend/fixtures/deployed-policy-34d7cc9.rules']].map(async([name,path])=>({name,content:await readFile(path,'utf8')})));
 console.log(JSON.stringify(await compareRuleCompilers({sources,request:data=>client.request({url:'https://firebaserules.googleapis.com/v1/projects/beyond-20261018:test',method:'POST',data,timeout:20000,retry:false})}),null,2));
}
