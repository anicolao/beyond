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
