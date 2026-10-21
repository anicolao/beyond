import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
/** Each suite gets fresh SDK contexts. Skip compiler work only after reading
 * one exact installed source from the explicit isolated emulator. A prior Node
 * startup process or SDK suite cannot populate a reliable in-process cache. */
export function backendRulesInitializer(initialize=initializeTestEnvironment,request=fetch){
 /** @param {Parameters<typeof initializeTestEnvironment>[0]} config */
 return async function initializeBackendRules(config){
  const {rules,...firestore}=config.firestore??{};
  if(typeof rules!=='string'||!rules)throw new Error('Backend suites must supply the exact source rules.');
  if(!/^(127\.0\.0\.1|localhost)$/.test(firestore.host??'')||!Number.isInteger(firestore.port)||firestore.port<1024||firestore.port>65535)throw new Error('Backend source readback requires an explicit local emulator endpoint.');
  if(!/^[a-z][a-z0-9-]*$/.test(config.projectId))throw new Error('Backend source readback requires an explicit project.');
  // Remain within the original external5s hook budget. No retries or fresh
  // per-request deadline can extend the caller's initialization allowance.
  const response=await request(`http://${firestore.host}:${firestore.port}/emulator/v1/projects/${config.projectId}:securityRules`,{signal:AbortSignal.timeout(5000)});
  if(!response.ok&&response.status!==404)throw new Error(`Backend exact-source readback failed (${response.status}).`);
  const installed=response.ok?await response.json():undefined;
  const same=installed?.rules?.files?.length===1&&installed.rules.files[0].content===rules&&!(installed.issues??[]).some(issue=>issue.severity==='ERROR');
  // A mismatch always supplies the full requested source to the real compiler.
  // Identical content needs no upload; all ordinary SDK/auth contexts are fresh.
  return initialize(same?{...config,firestore}:config);
 };
}
export const initializeBackendTestEnvironment=backendRulesInitializer();
