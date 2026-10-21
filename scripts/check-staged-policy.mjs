import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const root = mkdtempSync(join(tmpdir(), 'beyond-staged-policy-'));
try {
  const paths = execFileSync('git', ['ls-files', '-z', '--', ':(glob)tests/e2e/**/*.ts', ':(glob)tests/e2e/**/*.mjs', 'playwright.config.ts', 'scripts/check-e2e-policy.mjs'], { encoding: 'utf8' }).split('\0').filter(p => p.endsWith('.ts') || p.endsWith('.mjs'));
  for (const path of paths) {
    const target = join(root, path); mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, execFileSync('git', ['show', `:${path}`]));
  }
  const { checkPolicy } = await import(pathToFileURL(join(root, 'scripts/check-e2e-policy.mjs')).href);
  const errors = checkPolicy(root);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Staged E2E policy passed.');
} finally { rmSync(root, { recursive: true, force: true }); }
