import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deployFirestoreRules } from './deploy-firestore-rules.mjs';

const root = 'projects/beyond-20261018';
const release = `${root}/releases/cloud.firestore`;
const old = `${root}/rulesets/old`;
const next = `${root}/rulesets/new`;
function server({ exists = true, same = false, patchStatuses = [], createRace = false, compileError = false, badUpload = false, badRelease = false } = {}) {
  const calls = [], pauses = [];
  let active = exists ? (same ? next : old) : null;
  const request = async ({ method, path, data }) => {
    calls.push({ method, path, data });
    if (path === `${root}:test`) return { status: 200, data: { issues: [{ severity: compileError ? 'ERROR' : 'WARNING' }] } };
    if (method === 'GET' && path === release) return active ? { status: 200, data: { name: release, rulesetName: badRelease ? old : active } } : { status: 404 };
    if (method === 'GET' && [old, next].includes(path)) return { status: 200, data: { source: { files: [{ name: 'firestore.rules', content: path === next && !badUpload ? 'current' : 'previous' }] } } };
    if (method === 'POST' && path === `${root}/rulesets`) {
      assert.deepEqual(data, { source: { files: [{ name: 'firestore.rules', content: 'current' }] } });
      return { status: 200, data: { name: next } };
    }
    if (method === 'POST' && path === `${root}/releases`) {
      assert.deepEqual(data, { name: release, rulesetName: next });
      if (createRace) { active = old; return { status: 409 }; }
      active = next; return { status: 200 };
    }
    if (method === 'PATCH' && path === release) {
      assert.deepEqual(data, { release: { name: release, rulesetName: next }, updateMask: 'rulesetName' });
      const status = patchStatuses.shift() ?? 200;
      if (status === 200) active = next;
      else throw { response: { status }, secret: 'must never be serialized' };
      return { status };
    }
    throw new Error(`Unexpected ${method} ${path}`);
  };
  return { calls, pauses, run: () => deployFirestoreRules({ content: 'current', request, pause: async ms => pauses.push(ms) }) };
}
const writes = s => s.calls.filter(c => ['POST', 'PATCH'].includes(c.method) && !c.path.endsWith(':test'));
test('existing release is patched with exact compiled/uploaded/readback source, never created', async () => {
  const s = server(); assert.equal((await s.run()).verified, true);
  assert.deepEqual(writes(s).map(c => [c.method, c.path]), [['POST', `${root}/rulesets`], ['PATCH', release]]);
  assert.equal(s.calls[0].path, `${root}:test`);
  assert.deepEqual(s.calls.slice(-2).map(c => c.path), [release, next]);
});
test('only a confirmed missing release permits creation', async () => {
  const s = server({ exists: false }); await s.run();
  assert.deepEqual(writes(s).map(c => c.method), ['POST', 'POST']);
});
test('transient PATCH failures retry PATCH without falling through to create', async () => {
  const s = server({ patchStatuses: [503, 429] }); await s.run();
  assert.equal(s.calls.filter(c => c.method === 'PATCH').length, 3);
  assert.equal(s.calls.filter(c => c.method === 'POST' && c.path.endsWith('/releases')).length, 0);
  assert.deepEqual(s.pauses, [1000, 2000]);
});
test('permanent PATCH failure is preserved, sanitized and never attempts creation', async () => {
  const s = server({ patchStatuses: [403] });
  await assert.rejects(s.run(), { message: `Rules PATCH ${release}: HTTP 403; publication blocked` });
  assert.equal(s.calls.filter(c => c.method === 'POST' && c.path.endsWith('/releases')).length, 0);
});
test('persistent transient failure is bounded and does not publish a fallback', async () => {
  const s = server({ patchStatuses: [503, 503, 503] });
  await assert.rejects(s.run(), /HTTP 503/);
  assert.equal(s.calls.filter(c => c.method === 'PATCH').length, 3);
  assert.equal(s.calls.filter(c => c.method === 'POST' && c.path.endsWith('/releases')).length, 0);
});
test('true create conflict confirms release then patches exact desired ruleset', async () => {
  const s = server({ exists: false, createRace: true }); await s.run();
  const i = s.calls.findIndex(c => c.method === 'POST' && c.path.endsWith('/releases'));
  assert.deepEqual(s.calls.slice(i + 1, i + 3).map(c => c.method), ['GET', 'PATCH']);
});
test('compiler errors prevent all writes', async () => {
  const s = server({ compileError: true }); await assert.rejects(s.run(), /compilation rejected/); assert.equal(writes(s).length, 0);
});
test('already-current source is compiled and read back without another write', async () => {
  const s = server({ same: true }); await s.run(); assert.equal(writes(s).length, 0);
  assert.equal(s.calls[0].path, `${root}:test`); assert.equal(s.calls.at(-1).path, next);
});
test('uploaded source mismatch blocks release update', async () => {
  const s = server({ badUpload: true }); await assert.rejects(s.run(), /Uploaded rules differ/);
  assert.equal(s.calls.filter(c => c.method === 'PATCH').length, 0);
});
test('release readback mismatch blocks publication', async () => {
  const s = server({ badRelease: true }); await assert.rejects(s.run(), /Release readback differs/);
});
