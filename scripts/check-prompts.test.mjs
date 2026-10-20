import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const checker = resolve(import.meta.dirname, 'check-prompts.mjs');
const initial = '# Project prompts\n\n## Prompt 1: Initial Request\n\nFirst user request.\n';
const next = '\n## Prompt 2: Followup Request\n\nSecond user request.\n';

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'beyond-prompts-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.name', 'Prompt Test');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'core.hooksPath', '/dev/null');
  git('config', 'commit.gpgsign', 'false');
  const write = (text, path = 'PROMPTS.md') => writeFileSync(join(cwd, path), text);
  const check = (...args) => spawnSync(process.execPath, [checker, ...args], { cwd, encoding: 'utf8' }).status;
  const seed = () => { write(initial); git('add', 'PROMPTS.md'); git('commit', '-qm', 'Record first prompt'); };
  return { git, write, check, seed };
}

test('requires a staged prompt log, including on the initial commit', (t) => {
  const f = fixture(t);
  assert.notEqual(f.check(), 0);
  f.write(initial);
  assert.notEqual(f.check(), 0);
  f.git('add', 'PROMPTS.md');
  assert.equal(f.check(), 0);
});

test('accepts a staged append and rejects an unstaged append', (t) => {
  const f = fixture(t); f.seed(); f.write(initial + next);
  assert.notEqual(f.check(), 0);
  f.git('add', 'PROMPTS.md');
  assert.equal(f.check(), 0);
});

test('rejects rewritten or deleted historical prompts', (t) => {
  const f = fixture(t); f.seed(); f.write(initial.replace('First user', 'Changed user') + next);
  f.git('add', 'PROMPTS.md');
  assert.notEqual(f.check(), 0);
  f.git('rm', '-f', 'PROMPTS.md');
  assert.notEqual(f.check(), 0);
});

test('rejects empty bodies, invalid summaries, numbering gaps, and bare append text', (t) => {
  const f = fixture(t); f.seed();
  for (const added of [
    '\n## Prompt 2: Empty Request\n\n  \n',
    '\n## Prompt 2: Single\n\nRequest.\n',
    '\n## Prompt 2: Too Many Summary Words\n\nRequest.\n',
    '\n## Prompt 3: Wrong Number\n\nRequest.\n',
    '\nUnheaded text.\n',
  ]) {
    f.write(initial + added); f.git('add', 'PROMPTS.md');
    assert.notEqual(f.check(), 0, added);
  }
});

test('accepts a unique continuation bound to the latest exact prompt log', (t) => {
  const f = fixture(t); f.seed();
  const hash = createHash('sha256').update(initial).digest('hex');
  f.write(`Prompt 1 | ${hash} | Implement the second logical step\n`, 'PROMPT_WORK.md');
  f.git('add', 'PROMPT_WORK.md');
  assert.equal(f.check(), 0);
  f.git('commit', '-qm', 'Record continuation');
  assert.notEqual(f.check(), 0);
  f.write(`Prompt 1 | ${'0'.repeat(64)} | Implement another logical step\n`, 'PROMPT_WORK.md');
  f.git('add', 'PROMPT_WORK.md');
  assert.notEqual(f.check(), 0);
});

test('checks a PR against its base, including a base with no prompt log', (t) => {
  const f = fixture(t);
  f.git('commit', '--allow-empty', '-qm', 'Repository foundation');
  const base = f.git('rev-parse', 'HEAD').trim();
  f.write(initial); f.git('add', 'PROMPTS.md'); f.git('commit', '-qm', 'Record first prompt');
  assert.equal(f.check('--base', base), 0);
  assert.notEqual(f.check('--base', 'HEAD'), 0);
});

test('the installed pre-commit hook blocks commits without a staged prompt', (t) => {
  const f = fixture(t);
  const cwd = f.git('rev-parse', '--show-toplevel').trim();
  mkdirSync(join(cwd, '.githooks'));
  mkdirSync(join(cwd, 'scripts'));
  cpSync(resolve(import.meta.dirname, '../.githooks/pre-commit'), join(cwd, '.githooks/pre-commit'));
  cpSync(checker, join(cwd, 'scripts/check-prompts.mjs'));
  cpSync(resolve(import.meta.dirname, 'check-staged-policy.mjs'), join(cwd, 'scripts/check-staged-policy.mjs'));
  cpSync(resolve(import.meta.dirname, 'check-e2e-policy.mjs'), join(cwd, 'scripts/check-e2e-policy.mjs'));
  cpSync(resolve(import.meta.dirname, '../playwright.config.ts'), join(cwd, 'playwright.config.ts'));
  cpSync(resolve(import.meta.dirname, '../tests/e2e'), join(cwd, 'tests/e2e'), { recursive: true, filter: path => !path.includes('/screenshots/') && !path.includes('/stories/') });
  chmodSync(join(cwd, '.githooks/pre-commit'), 0o755);
  f.git('config', 'core.hooksPath', '.githooks');
  f.git('add', '.');
  const commit = () => spawnSync('git', ['commit', '--allow-empty', '-qm', 'Check real hook'], { cwd }).status;
  assert.notEqual(commit(), 0);
  f.write(initial); f.git('add', 'PROMPTS.md');
  assert.equal(commit(), 0);
  f.write(initial + next);
  assert.notEqual(commit(), 0);
});


test('explicit PR-base validation accepts multiple valid commits while the local hook requires one step',t=>{
 const f=fixture(t);f.seed();const base=f.git('rev-parse','HEAD').trim();
 const digest=createHash('sha256').update(initial).digest('hex');
 f.write(`Prompt 1 | ${digest} | First distinct logical continuation\n\nPrompt 1 | ${digest} | Second distinct logical continuation\n`,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');
 assert.notEqual(f.check(),0);assert.equal(f.check('--base',base),0);
});
test('PR-base continuation validation rejects a bad or duplicate later entry',t=>{
 const f=fixture(t);f.seed();const base=f.git('rev-parse','HEAD').trim();const digest=createHash('sha256').update(initial).digest('hex');
 const first=`Prompt 1 | ${digest} | First distinct logical continuation`;
 for(const bad of [first,`Prompt 1 | ${'0'.repeat(64)} | Incorrect digest continuation`,`Prompt 2 | ${digest} | Incorrect latest prompt continuation`]){
  f.write(`${first}\n\n${bad}\n`,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');assert.notEqual(f.check('--base',base),0);
 }
});

test('stacked PR-base comparison preserves both append-only branch histories without weakening local commit checks',t=>{
 const f=fixture(t);f.seed();const digest=createHash('sha256').update(initial).digest('hex');
 const first=`Prompt 1 | ${digest} | Common logical continuation\n`;
 const parent=`Prompt 1 | ${digest} | Parent logical continuation\n`;
 const child=`Prompt 1 | ${digest} | Child logical continuation\n`;
 f.write(first,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Common step');const common=f.git('rev-parse','HEAD').trim();
 f.write(first+parent,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Parent step');const base=f.git('rev-parse','HEAD').trim();
 f.git('checkout','--detach',common);f.write(first+child,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Child step');
 f.write(first+child+parent,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');assert.equal(f.check(),0);assert.equal(f.check('--base',base),0);
 for(const invalid of [first+child,child+parent,first+child+parent+child]){f.write(invalid,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');assert.notEqual(f.check('--base',base),0);}
});

test('real stacked merge preserves both parents and requires exactly one newly authored continuation',t=>{
 const f=fixture(t);f.seed();const digest=createHash('sha256').update(initial).digest('hex');
 const row=label=>`Prompt 1 | ${digest} | ${label} logical continuation\n`;
 const common=row('Common'),parent=row('Parent'),child=row('Child'),merge=row('Merge');
 f.write(common,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Common');const base=f.git('rev-parse','HEAD').trim();
 f.write(common+parent,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Parent');const incoming=f.git('rev-parse','HEAD').trim();
 f.git('checkout','--detach',base);f.write(common+child,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Child');
 const cwd=f.git('rev-parse','--show-toplevel').trim();spawnSync('git',['merge','--no-commit',incoming],{cwd,stdio:'pipe'});
 for(const [text,valid]of [[common+child+parent,false],[common+child+parent+merge,true],[common+child+merge,false],[common+child+parent+merge+row('Extra'),false]]){
  f.write(text,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');assert.equal(f.check()===0,valid,text);
 }
});

test('advanced stacked base accepts an older continuation only with its exact committed prompt proof',t=>{
 const f=fixture(t);f.seed();const common=f.git('rev-parse','HEAD').trim();
 const oldDigest=createHash('sha256').update(initial).digest('hex');
 const old=`Prompt 1 | ${oldDigest} | Child implementation before next prompt\n`;
 f.write(old,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Earlier child work');const child=f.git('rev-parse','HEAD').trim();
 f.git('checkout','--detach',common);f.write(initial+next);f.git('add','PROMPTS.md');f.git('commit','-qm','Advanced parent prompt');const parent=f.git('rev-parse','HEAD').trim();
 f.git('checkout','--detach',child);const cwd=f.git('rev-parse','--show-toplevel').trim();spawnSync('git',['merge','--no-commit',parent],{cwd,stdio:'pipe'});
 const digest=createHash('sha256').update(initial+next).digest('hex'),step=`Prompt 2 | ${digest} | Merge the reviewed stacked implementation\n`;
 f.write(old+step,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');f.git('commit','-qm','Merge parent');
 assert.equal(f.check('--base',parent),0);
 f.write(old+step+`Prompt 1 | ${oldDigest} | Invented uncommitted historical continuation\n`,'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');assert.notEqual(f.check('--base',parent),0);
});

test('committed earlier work can cite its preserved prompt snapshot after a later prompt is bundled',t=>{
 const f=fixture(t);f.seed();const common=f.git('rev-parse','HEAD').trim();const digest=createHash('sha256').update(initial).digest('hex');
 const record=`Prompt 1 | ${digest} | Work recorded before the later reviewer prompt\n`;
 f.write(initial+next);f.write(record,'PROMPT_WORK.md');f.git('add','PROMPTS.md','PROMPT_WORK.md');f.git('commit','-qm','Bundle prior work and later prompt');const child=f.git('rev-parse','HEAD').trim();
 f.git('checkout','--detach',common);f.write(initial+next);f.git('add','PROMPTS.md');f.git('commit','-qm','Parent advances prompt');const parent=f.git('rev-parse','HEAD').trim();
 f.git('checkout','--detach',child);assert.equal(f.check('--base',parent),0);
 f.write(record.replace(digest,'0'.repeat(64)),'PROMPT_WORK.md');f.git('add','PROMPT_WORK.md');assert.notEqual(f.check('--base',parent),0);
});
