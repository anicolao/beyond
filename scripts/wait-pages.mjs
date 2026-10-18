import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
const repository = process.env.GITHUB_REPOSITORY;
try { execFileSync('gh', ['api', '--method', 'POST', `repos/${repository}/pages/builds`], { stdio: 'pipe' }); } catch { /* An existing Pages build may already be queued by the publication action. */ }
const url = `https://anicolao.github.io${process.env.PUBLIC_BASE_PATH}/`;
for (let attempt = 0; attempt < 90; attempt++) {
  const response = await fetch(`${url}revision.json`, { cache: 'no-store' }).catch(() => undefined);
  if (response?.ok && (await response.json()).revision === process.env.DEPLOY_REVISION) {
    console.log(`Live preview: ${url}`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Preview: [${url}](${url}) · revision ${process.env.DEPLOY_REVISION}\n`);
    process.exit(0);
  }
  await delay(4_000);
}
throw new Error('Pages has not served the expected revision within the deployment deadline');
