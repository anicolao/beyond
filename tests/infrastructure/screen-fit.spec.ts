// Synthetic DOM fixtures test the capture guard itself, not a game user story.
import { test, expect } from '@playwright/test';
import { assertScreenFit } from '../e2e/helpers/screen-fit';
const fixture = (angle: number, buttonTop: number) => `<style>
  *{box-sizing:border-box}body{margin:0}
  main{position:absolute;left:200px;top:200px;width:400px;height:300px;transform:rotate(${angle}deg)}
  input,button{position:absolute;left:40px;height:48px;margin:0;border:1px solid}
  input{top:40px;width:200px}button{top:${buttonTop}px;width:100px}
  </style><main data-e2e-layout><input aria-label="Name"><button>Join</button></main>`;
for (const angle of [0,45,90,135,180,225,270,315]) {
  test(`separate controls pass at ${angle} degrees`, async ({ page }) => {
    await page.setContent(fixture(angle,110));
    await page.evaluate(assertScreenFit, {});
  });
  test(`real overlap fails at ${angle} degrees`, async ({ page }) => {
    await page.setContent(fixture(angle,70));
    await expect(page.evaluate(assertScreenFit, {})).rejects.toThrow('Controls overlap');
  });
}
test('viewport clipping still fails', async ({ page }) => {
  await page.setContent('<main data-e2e-layout style="position:absolute;left:990px;width:40px;height:80px"><button>Join</button></main>');
  await expect(page.evaluate(assertScreenFit, {})).rejects.toThrow('clipped by viewport');
});
test('text clipped by an ancestor still fails', async ({ page }) => {
  await page.setContent('<main data-e2e-layout><div style="width:30px;overflow:hidden;white-space:nowrap"><span>Read the complete player name</span></div></main>');
  await expect(page.evaluate(assertScreenFit, {})).rejects.toThrow('clipped by div');
});
test('offscreen document controls have no inverted hit region', async ({ page }) => {
  await page.setContent('<button style="position:absolute;top:900px;width:100px;height:50px">First</button><button style="position:absolute;top:1100px;width:100px;height:50px">Second</button>');
  await page.evaluate(assertScreenFit, { document: true });
});
test('real on-screen document overlap still fails', async ({ page }) => {
  await page.setContent('<button style="position:absolute;top:100px;width:100px;height:50px">First</button><button style="position:absolute;top:120px;width:100px;height:50px">Second</button>');
  await expect(page.evaluate(assertScreenFit, { document: true })).rejects.toThrow('Controls overlap');
});
const scrollingDialog = (overflow = 'auto', named = true) => `<style>*{box-sizing:border-box}body{margin:0}dialog{width:600px;height:600px;padding:20px;overflow:hidden}.scroll{height:400px;overflow-y:${overflow}}button{height:48px;min-width:100px}.long{height:700px}</style><dialog><button>Close</button><div class="scroll" ${named ? 'role="region" tabindex="0" aria-label="Card details"' : ''}><div class="long">Readable card face and long source notes</div><button>Source</button></div><button>Next</button></dialog>`;
test('named keyboard scroll region permits intentional internal overflow', async ({ page }) => {
  await page.setContent(scrollingDialog());
  await page.locator('dialog').evaluate((element: HTMLDialogElement) => element.showModal());
  await page.evaluate(assertScreenFit, { document: true });
});
test('scrolling content does not excuse hidden clipping', async ({ page }) => {
  await page.setContent(scrollingDialog('hidden'));
  await page.locator('dialog').evaluate((element: HTMLDialogElement) => element.showModal());
  await expect(page.evaluate(assertScreenFit, { document: true })).rejects.toThrow('clipped');
});
test('unnamed unreachable overflow is not a scroll region', async ({ page }) => {
  await page.setContent(scrollingDialog('auto', false));
  await page.locator('dialog').evaluate((element: HTMLDialogElement) => element.showModal());
  await expect(page.evaluate(assertScreenFit, { document: true })).rejects.toThrow('clipped');
});
test('focused content clipped inside a scroll region still fails', async ({ page }) => {
  await page.setContent(scrollingDialog());
  await page.locator('dialog').evaluate((element: HTMLDialogElement) => element.showModal());
  await page.getByRole('button', { name: 'Source' }).focus();
  await page.locator('.scroll').evaluate(element => { element.scrollTop = 0; });
  await expect(page.evaluate(assertScreenFit, { document: true })).rejects.toThrow('clipped');
});
test('focusing a scroll region does not require its entire contents on screen', async ({ page }) => {
  await page.setContent(scrollingDialog());
  await page.locator('dialog').evaluate((element: HTMLDialogElement) => element.showModal());
  await page.getByRole('region', { name: 'Card details' }).focus();
  await page.evaluate(assertScreenFit, { document: true });
});
test('modal navigation outside its window still fails', async ({ page }) => {
  await page.setContent(scrollingDialog().replace('<button>Next</button>', '<button style="position:fixed;top:790px">Next</button>'));
  await page.locator('dialog').evaluate((element: HTMLDialogElement) => element.showModal());
  await expect(page.evaluate(assertScreenFit, { document: true })).rejects.toThrow('clipped');
});

for(const size of [43,44])test(`batched capture target audit ${size}px ${size===44?'passes':'fails'}`,async({page})=>{
 await page.setContent(`<main data-e2e-layout><button style="width:${size}px;height:44px;padding:0">Go</button></main>`);
 if(size===44)await page.evaluate(assertScreenFit,{touchTargets:true});
 else await expect(page.evaluate(assertScreenFit,{touchTargets:true})).rejects.toThrow('Touch target too small');
});
test('batched target audit still checks visible background controls behind a modal',async({page})=>{
 await page.setContent('<button style="width:20px;height:20px;padding:0" aria-label="Background">X</button><dialog data-e2e-layout><button style="width:80px;height:44px">Close</button></dialog>');
 await page.locator('dialog').evaluate((element:HTMLDialogElement)=>element.showModal());
 await expect(page.evaluate(assertScreenFit,{touchTargets:true})).rejects.toThrow('Touch target too small');
});
