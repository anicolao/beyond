import { chromium, expect } from '@playwright/test';
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
  await page.getByRole('link', { name: 'Card gallery' }).click();
  await page.getByRole('button', { name: 'Inspect Hypercomputing', exact: true }).click();
  const inspection = page.getByRole('dialog', { name: 'Card inspection' });
  await inspection.getByRole('heading', { name: 'Hypercomputing', exact: true }).waitFor();
  await inspection.getByRole('button', { name: 'Next card' }).click();
  await inspection.getByRole('heading', { name: 'Advanced Robotics', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Presentation', exact: true }).selectOption({ label: 'Example markers' });
  await page.getByRole('button', { name: 'System', exact: true }).click();
  await page.getByText('Colony · Ada', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Observatory' }).click();
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
  const tabletopId = new URL(page.url()).searchParams.get('table');
  for (const [name, faction] of [['Preview Ada','Nishida-Østergaard Corporation'],['Preview Bora','United Nations of Sol']]) {
    await page.getByRole('button', { name: `Choose faction for ${name}`, exact: true }).click();
    await page.getByRole('button', { name: `Select ${faction}`, exact: true }).click();
    await expect(page.getByRole('dialog', { name: `Basic faction for ${name}`, exact: true })).not.toBeVisible();
  }
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.getByRole('region', { name: 'Basic game starting position', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Inspect Preview Ada faction mat', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Observatory', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('link', { name: 'Create a remote room', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Preview Host');
  await page.getByRole('button', { name: 'Create room', exact: true }).click();
  await page.getByRole('heading', { name: 'Gather your players', exact: true }).waitFor();
  const code = (await page.locator('[aria-label="Invitation code"]').innerText()).trim();
  const guest = await browser.newPage({ viewport: { width:393, height:852 } });
  guest.setDefaultTimeout(10_000);
  await guest.goto(new URL('remote/?code', url).href);
  await guest.getByRole('textbox', { name: 'Invitation code', exact: true }).fill(code);
  await guest.getByRole('button', { name: 'Find room', exact: true }).click();
  await guest.getByRole('button', { name: 'Take seat 2', exact: true }).click();
  await guest.getByRole('textbox', { name: 'Your name', exact: true }).fill('Preview Guest');
  await guest.getByRole('button', { name: 'Join room', exact: true }).click();
  await page.getByRole('heading', { name: 'Preview Guest', exact: true }).waitFor();
  for (const [actor, name, faction] of [[page,'Preview Host','Nishida-Østergaard Corporation'],[guest,'Preview Guest','United Nations of Sol']]) {
    await actor.getByRole('button', { name: `Choose faction for ${name}`, exact: true }).click();
    await actor.getByRole('button', { name: `Select ${faction}`, exact: true }).click();
    await expect(actor.getByRole('dialog', { name: `Basic faction for ${name}`, exact: true })).not.toBeVisible();
  }
  await expect(page.locator('.seat-faction').filter({ hasText:'United Nations' })).toBeVisible();
  await guest.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('1 of 2 players ready');
  await page.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Everyone is ready');
  await page.getByRole('button', { name: 'Edit setup', exact: true }).click();
  await page.getByRole('dialog', { name: 'Edit room setup' }).getByRole('combobox', { name: 'Achievements', exact: true }).selectOption('randomized');
  await expect(guest.getByRole('status')).toHaveText('0 of 2 players ready');
  await guest.reload();
  await guest.getByRole('heading', { name: 'Preview Guest', exact: true }).waitFor();
  await expect(guest.locator('.room-setup dd').last()).toHaveText('Randomized');
  await page.keyboard.press('Escape');
  await guest.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('1 of 2 players ready');
  await page.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Everyone is ready');
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.getByRole('region', { name: 'Basic game starting position', exact: true }).waitFor();
  await guest.getByRole('region', { name: 'Basic game starting position', exact: true }).waitFor();
  await guest.reload();
  await guest.getByRole('region', { name: 'Basic game starting position', exact: true }).waitFor();
  await expect(guest.getByRole('button', { name: 'Full faction mat', exact: true })).toBeEnabled();
  writeFileSync('preview-smoke.json', JSON.stringify({ url, revision: revision.revision, table: tabletopId, remote: new URL(page.url()).searchParams.get('room'), gallery: 'Family filtering, original card inspection, keyboard return and colony fixture passed', result: 'Hosted anonymous Auth and production Firestore: physical seating/factions/Begin/reload and separate-identity remote code/claim/factions/readiness/reset/Begin/restoration passed' }, null, 2));
  console.log('Hosted preview tabletop and separate-identity remote flows passed against production Firestore.');
} finally { await browser.close(); }
