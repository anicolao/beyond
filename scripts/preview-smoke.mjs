import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const url = process.env.PREVIEW_URL;
if (!url?.startsWith('https://')) throw new Error('A hosted preview URL is required');
const revision = await (await fetch(new URL('revision.json', url))).json();
if (process.env.EXPECTED_REVISION && revision.revision !== process.env.EXPECTED_REVISION) throw new Error('Preview does not match the expected revision');
const browser = await chromium.launch({ args: ['--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10_000);
  await page.goto(url);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: /Shared table/ }).click();
  for (const [position, name] of [['South', 'Preview Ada'], ['North', 'Preview Bora']]) {
    await page.getByRole('button', { name: `Join at ${position}`, exact: true }).click();
    await page.getByLabel(`${position} player name`).fill(name);
    await page.getByRole('button', { name: 'Join table', exact: true }).click();
    await page.getByRole('heading', { name, exact: true }).waitFor();
  }
  await page.reload();
  await page.getByRole('heading', { name: 'Preview Ada', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Preview Bora', exact: true }).waitFor();
  writeFileSync('preview-smoke.json', JSON.stringify({ url, revision: revision.revision, table: new URL(page.url()).searchParams.get('table'), result: 'Hosted anonymous Auth and Firestore physical-seat join/reload passed' }, null, 2));
  console.log('Hosted preview physical-seat join/reload passed against production Firestore.');
} finally { await browser.close(); }
