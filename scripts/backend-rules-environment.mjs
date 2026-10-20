import {createHash} from 'node:crypto';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
/** Each suite gets fresh SDK contexts. Only identical compiler work on the
 * same isolated endpoint/project is shared; changed source is always loaded.
 * Rules-disabled fixture contexts do not change the installed ruleset. */
export function backendRulesInitializer(initialize=initializeTestEnvironment){
 const compiled=new Map();
 /** @param {Parameters<typeof initializeTestEnvironment>[0]} config */
 return async function initializeBackendRules(config){
  const {rules,...firestore}=config.firestore??{};
  if(typeof rules!=='string'||!rules)throw new Error('Backend suites must supply the exact source rules.');
  if(!('host' in firestore)||!('port' in firestore))throw new Error('Backend compiler cache requires an explicit emulator endpoint.');
  const endpoint=JSON.stringify([config.projectId,firestore.host,firestore.port]);
  const digest=createHash('sha256').update(rules).digest('hex');
  const same=compiled.get(endpoint)===digest;
  const environment=await initialize(same?{...config,firestore}:config);
  compiled.set(endpoint,digest);
  return environment;
 };
}
export const initializeBackendTestEnvironment=backendRulesInitializer();
