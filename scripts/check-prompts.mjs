import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

function fail(message) {
  throw new Error(message);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function trackedAt(ref, path) {
  return git(['ls-tree', '--name-only', ref, '--', path]).trim()
    ? git(['show', `${ref}:${path}`]) : '';
}

function validateLog(log) {
  if (!log.startsWith('# Project prompts\n\n')) fail('Missing project prompt-log header.');
  const entries = [...log.matchAll(/^## Prompt ([1-9][0-9]*): ([^\n]+)\n\n/gm)];
  if (!entries.length) fail('Record at least one verbatim user prompt.');
  if ([...log.matchAll(/^## Prompt /gm)].length !== entries.length) {
    fail('Every prompt needs a numbered heading, summary, and blank line.');
  }
  for (const [index, entry] of entries.entries()) {
    if (Number(entry[1]) !== index + 1) fail('Prompt numbers must be consecutive from 1.');
    if (!/^\S+(?: \S+){1,2}$/.test(entry[2])) fail('Use a 2–3 word summary.');
    const body = log.slice(entry.index + entry[0].length, entries[index + 1]?.index ?? log.length);
    if (!body.trim()) fail('Prompt bodies must be nonempty.');
  }
  return entries.at(-1)[1];
}

try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--base')) {
    fail('Usage: node scripts/check-prompts.mjs [--base REVISION]');
  }
  let base = args[1];
  if (!base && spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { stdio: 'ignore' }).status === 0) {
    base = 'HEAD';
  }
  const entries = git(['ls-files', '--stage', '--', 'PROMPTS.md']);
  if (!/^100644 [0-9a-f]+ 0\tPROMPTS\.md\n$/.test(entries)) {
    fail('Stage PROMPTS.md as a regular file with the verbatim user prompts.');
  }
  const staged = git(['show', ':PROMPTS.md']);
  const previous = base ? trackedAt(base, 'PROMPTS.md') : '';
  if (!staged.startsWith(previous)) fail('Preserve existing prompt history byte for byte.');
  const latest = validateLog(staged);
  if (staged.length > previous.length) {
    const added = staged.slice(previous.length);
    if (!/(?:^|\n)## Prompt [1-9][0-9]*: /m.test(added)) {
      fail('Append a complete new prompt, not just text after an existing entry.');
    }
    console.log('Prompt log check passed.');
  } else {
    const work = git(['show', ':PROMPT_WORK.md']);
    const oldWork = base ? trackedAt(base, 'PROMPT_WORK.md') : '';
    if (!work.startsWith(oldWork)) fail('Preserve existing continuation history.');
    const line = work.slice(oldWork.length).trim();
    const parts = line.split(' | ');
    const digest = createHash('sha256').update(staged).digest('hex');
    if (parts.length !== 3 || parts[0] !== `Prompt ${latest}` || parts[1] !== digest
        || !/^[^\r\n]{10,200}$/.test(parts[2]) || oldWork.split('\n').includes(line)) {
      fail('Append a unique continuation for the latest prompt and exact staged log SHA-256.');
    }
    console.log('Prompt continuation check passed.');
  }
} catch (error) {
  console.error(`Prompt log check failed: ${error.message}`);
  process.exitCode = 1;
}
