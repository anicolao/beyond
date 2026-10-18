import { test } from 'node:test';
import assert from 'node:assert/strict';
import { violations, checkPolicy } from './check-e2e-policy.mjs';
import { readFileSync } from 'node:fs';
test('rejects forbidden waiting, masking, tolerance, retries, skipped tests and operation budgets', () => {
  for (const source of ['page.waitForTimeout(1)', 'setTimeout(run, 2)', "waitUntil: 'networkidle'", 'test.only("x")', 'test.skip("x")', 'retries: 1', 'maxDiffPixels: 1', 'threshold: 0.1', 'mask: [region]', 'test.setTimeout(30000)', 'timeout: 2_001']) assert.ok(violations(source).length, source);
  assert.deepEqual(violations('retries: 0, maxDiffPixels: 0, threshold: 0, timeout: 2_000'), []);
});
test('the real capture infrastructure retains every required guard', () => { assert.deepEqual(checkPolicy(), []); });
test('preview publication stays independent and deploys hosted rules before publishing the client', () => {
  const workflow = readFileSync('.github/workflows/preview.yml', 'utf8');
  assert.doesNotMatch(workflow, /^\s+needs:/m);
  assert.ok(workflow.indexOf('firebase deploy --only firestore:rules,auth') < workflow.indexOf('peaceiris/actions-gh-pages'));
  assert.match(workflow, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /scripts\/preview-smoke\.mjs/);
  assert.doesNotMatch(workflow, /PUBLIC_DATA_CHANNEL/);
  assert.match(workflow, /pull-requests: write/);
  assert.ok(workflow.indexOf('scripts/wait-pages.mjs') < workflow.indexOf('scripts/post-preview-comment.mjs'));
  assert.ok(workflow.indexOf('scripts/post-preview-comment.mjs') < workflow.indexOf('scripts/preview-smoke.mjs'));
  const backend = readFileSync('src/lib/backend.ts', 'utf8');
  assert.doesNotMatch(backend, /channels\/|PUBLIC_DATA_CHANNEL/);
  assert.match(backend, /games\/\$\{id\}/);
  assert.match(backend, /beyond-table-v1/);
});
