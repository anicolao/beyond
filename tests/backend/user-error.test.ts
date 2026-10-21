import {test,expect} from 'bun:test';
import {saveErrorMessage} from '../../src/lib/user-error';
test('player recovery messages exclude backend rules diagnostics and preserve useful local validation',()=>{
 const trace='PERMISSION_DENIED: evaluation error at L732 create / L720 update; internal rules trace';
 for(const code of ['permission-denied','firestore/permission-denied','internal','unavailable']){
  const message=saveErrorMessage(Object.assign(new Error(trace),{code}));expect(message).not.toContain(trace);expect(message).not.toContain('L732');expect(message).toMatch(/try again/);
 }
 expect(saveErrorMessage(new Error('Choose a ship for the mandatory upgrade.'))).toBe('Choose a ship for the mandatory upgrade.');
});

test('denied recovery reports controller authority rather than a connection outage',async()=>{
 const {recoveryAccessDenied,recoveryErrorMessage}=await import('../../src/lib/user-error');
 for(const code of ['permission-denied','firestore/permission-denied']){
  const cause=Object.assign(new Error('private rules trace with identity'),{code});
  expect(recoveryAccessDenied(cause)).toBe(true);
  expect(recoveryErrorMessage(cause)).toContain('original controller identity');
  expect(recoveryErrorMessage(cause)).not.toContain('private rules trace');
  expect(recoveryErrorMessage(cause)).not.toContain('Check your connection');
 }
 expect(recoveryAccessDenied({code:'unavailable'})).toBe(false);
 expect(recoveryErrorMessage({code:'unavailable'})).toContain('Check your connection');
});
