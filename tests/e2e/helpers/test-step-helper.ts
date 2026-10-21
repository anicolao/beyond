import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { identicalPixels, preparePixels } from './exact-pixels';
import { assertScreenFit, warmVisibleImages } from './screen-fit';

export const OPERATION_BUDGET = 2_000;
export interface Verification { spec: string; check: () => Promise<unknown> }
export interface StepView { page?: Page; player?: string; status?: 'synced' | 'offline' | 'reconnecting' | 'incompatible'; document?: boolean }
type RecordedStep = { id: string; description: string; player: string; verifications: string[]; image: string };
export type StoryRecord = { title: string; slug: string; project: string; platform: string; setup: string; viewports: string[]; steps: RecordedStep[] };
const records = new WeakMap<TestInfo, StoryRecord>();

export class TestStepHelper {
  constructor(private page: Page, private info: TestInfo, title: string) {
    if (!title.trim()) throw new Error('Stories need a title');
    if (!records.has(info)) records.set(info, { title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), project: info.project.name, platform: process.platform, viewports: info.annotations.find(a => a.type === 'viewports')?.description?.split(',') ?? [], setup: info.annotations.filter(a => a.type === 'setup').map(a => a.description).join('\n\n'), steps: [] });
  }
  async step(id: string, description: string, verifications: readonly Verification[], view: StepView = {}) {
    const record = records.get(this.info)!, page = view.page ?? this.page;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || record.steps.some(s => s.id === id)) throw new Error(`Invalid or duplicate step ID: ${id}`);
    if (!description.trim() || !verifications.length || verifications.some(v => !v.spec.trim())) throw new Error('Every step needs a caption and named assertions');
    const stem = `${String(record.steps.length).padStart(3, '0')}-${id}-${this.info.project.name}-${process.platform}.png`;
    await test.step(description, async () => {
      for (const verification of verifications) await test.step(verification.spec, verification.check, { timeout: OPERATION_BUDGET });
      await test.step('Ready, unclipped, photographed, and compared within 2,000 ms', async () => {
        const start = performance.now(), remaining = () => Math.max(1, OPERATION_BUDGET - Math.ceil(performance.now() - start));
        const path = this.info.snapshotPath(record.slug, stem);
        const updating = ['all', 'changed'].includes(this.info.config.updateSnapshots);
        const reference = !updating && existsSync(path) ? preparePixels(readFileSync(path)) : undefined;
        // Start independent readiness work together. Pointer placement remains
        // ordered after foregrounding; the strict final decode/layout audit and
        // native photograph run only after all three preparations complete.
        // All work stays inside the original shared 2,000 ms deadline.
        const [, , ready] = await Promise.all([
          (async () => { await page.bringToFront(); await page.mouse.move(0, 0); })(),
          page.evaluate(warmVisibleImages),
          page.waitForFunction(({ status }) => {
            const observed=document.querySelector('[data-backend-status]')?.getAttribute('data-backend-status');
            console.info('beyond-capture-ack',JSON.stringify({phase:'initial',expected:status,observed:observed??null}));
            return observed === status;
          }, { status: view.status ?? 'synced' }, { timeout: remaining(), polling: 20 })
        ]);
        await ready.dispose();
        // Warming may finish after the first acknowledgement; retain an exact
        // post-warm status check before the final preparation and capture.
        // Audit in the same browser call as the post-warm acknowledgement;
        // false status keeps the same20ms polling, and any audit error rejects.
        const current = await page.waitForFunction(assertScreenFit,
          { status: view.status ?? 'synced', document: view.document, touchTargets: true, prepare: true },
          { timeout: remaining(), polling: 20 });
        await current.dispose();
        const camera = await page.context().newCDPSession(page);
        let image: Buffer;
        try { image = Buffer.from((await camera.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false, optimizeForSpeed: true })).data, 'base64'); }
        finally { await camera.detach(); }
        if (updating) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, image); }
        else {
          const same = reference !== undefined && await identicalPixels(image, reference);
          if (!same) {
            await this.info.attach('actual', { body: image, contentType: 'image/png' });
            expect(image).toMatchSnapshot([record.slug, stem], { maxDiffPixels: 0, threshold: 0 });
            expect(same, 'Every RGBA byte must match the baseline').toBe(true);
          }
        }
        expect(performance.now() - start, 'Shared capture deadline').toBeLessThanOrEqual(OPERATION_BUDGET);
      }, { timeout: OPERATION_BUDGET });
    });
    record.steps.push({ id, description, player: view.player ?? 'Shared display', verifications: verifications.map(v => v.spec), image: `${record.slug}/${stem}` });
  }
}

export function saveStoryRecord(info: TestInfo) {
  const story = records.get(info);
  if (!story) return;
  const path = info.outputPath('story.json');
  writeFileSync(path, JSON.stringify({ ...story, generating: info.config.updateSnapshots !== 'none' }, null, 2));
  return path;
}
