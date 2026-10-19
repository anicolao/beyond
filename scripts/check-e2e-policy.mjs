import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function violations(source) {
  const banned = [
    [/\bwaitForTimeout\s*\(/, 'arbitrary wait'],
    [/\b(?:setTimeout|setInterval)\s*\(/, 'explicit timer'],
    [/networkidle/, 'network-idle wait'],
    [/\b(?:test|describe)\.(?:skip|only|fixme)\s*\(/, 'skipped or focused test'],
    [/\bretries\s*:\s*(?!0\b)\d+/, 'test retry'],
    [/\b(?:maxDiffPixels|threshold)\s*:\s*([\d.]+)/g, 'nonzero pixel tolerance'],
    [/\bmask\s*:/, 'screenshot masking'],
    [/\b(?:test\.setTimeout|test\.slow|page\.setDefaultTimeout|page\.setDefaultNavigationTimeout)\s*\(/, 'timeout override'],
    [/\btimeout\s*:\s*(\d[\d_]*)/g, 'oversized operation timeout']
  ];
  const found = [];
  for (const [pattern, message] of banned) {
    if (message === 'oversized operation timeout') {
      for (const match of source.matchAll(pattern)) if (Number(match[1].replaceAll('_', '')) > 2000) found.push(message);
    } else if (message === 'nonzero pixel tolerance') {
      for (const match of source.matchAll(pattern)) if (Number(match[1]) !== 0) found.push(message);
    } else if (pattern.test(source)) found.push(message);
  }
  return found;
}
function files(root) { return readdirSync(root, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(`${root}/${e.name}`) : [`${root}/${e.name}`]); }
export function checkPolicy(root = '.') {
  const errors = [];
  for (const path of files(`${root}/tests/e2e`).filter(p => p.endsWith('.ts'))) {
    const source = readFileSync(path, 'utf8');
    for (const error of violations(source)) errors.push(`${path}: ${error}`);
    if (path.endsWith('.spec.ts')) {
      if (!/from ['"]\.\.\/helpers\/fixtures['"]/.test(source) || !source.includes('new TestStepHelper(') || !source.includes('.step(')) errors.push(`${path}: illustrated fixture/helper required`);
      if (/\.screenshot\s*\(|toHaveScreenshot\s*\(|toMatchSnapshot\s*\(/.test(source)) errors.push(`${path}: capture bypass`);
    }
  }
  const helper = readFileSync(`${root}/tests/e2e/helpers/test-step-helper.ts`, 'utf8');
  for (const guard of ['OPERATION_BUDGET = 2_000', 'document.fonts.ready', 'i.decode()', 'assertScreenFit', 'identicalPixels', 'threshold: 0', 'maxDiffPixels: 0', 'toBeLessThanOrEqual(OPERATION_BUDGET)', 'verifications.length', 'data-backend-status', 'touchTargets: true']) {
    if (!helper.includes(guard)) errors.push(`Missing capture guard: ${guard}`);
  }
  const config = readFileSync(`${root}/playwright.config.ts`, 'utf8');
  for (const guard of ['retries: 0', 'forbidOnly: true', "updateSnapshots: 'none'", 'workers: 1', 'actionTimeout: 2_000', 'navigationTimeout: 2_000', 'maxDiffPixels: 0', 'threshold: 0']) if (!config.includes(guard)) errors.push(`Missing config guard: ${guard}`);
  return errors;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkPolicy();
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('E2E source policy passed.');
}
