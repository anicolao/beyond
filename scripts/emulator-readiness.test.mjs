import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireEmulatorReadiness } from './emulator-readiness.mjs';
const response = (status, body) => ({ status, async json() { return body; } });
test('startup requires both emulator services and protected rules, with no identity or write requests', async () => {
  const calls = [];
  await requireEmulatorReadiness('demo-beyond', async (url, options) => {
    calls.push({ url, options });
    return url.includes(':9297') ? response(200, {}) : response(403, { error: { status: 'PERMISSION_DENIED' } });
  });
  assert.equal(calls.length, 2);
  assert.ok(calls.every(({url,options}) => url.startsWith('http://127.0.0.1:') && !options.method && !options.body && !options.headers));
});
test('startup rejects a live project before sending any request', async () => {
  await assert.rejects(requireEmulatorReadiness('beyond-live', () => { throw new Error('must not request'); }), /isolated demo/);
});
test('startup fails closed for unavailable services, permissive rules or unexpected errors', async () => {
  for (const [authStatus, status, body] of [[503,403,{error:{status:'PERMISSION_DENIED'}}],[200,200,{}],[200,404,{error:{status:'NOT_FOUND'}}],[200,403,{error:{status:'OTHER'}}]]) {
    await assert.rejects(requireEmulatorReadiness('demo-beyond', async url => url.includes(':9297') ? response(authStatus,{}) : response(status,body)), /not ready/);
  }
});
