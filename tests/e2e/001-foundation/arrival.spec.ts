import { test, expect } from '../helpers/fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
test('Enter the observatory and learn the turn', async ({ page }, info) => {
  info.annotations.push({ type: 'viewports', description: 'phone,desktop,tabletop-4k' }, { type: 'setup', description: 'Arrival on a personal or shared display; real anonymous Auth emulator, no injected state or gameplay randomness.' });
  const steps = new TestStepHelper(page, info, info.title);
  await page.goto('./');
  await steps.step('arrival', 'Enter the orbital observatory', [{ spec: 'Play and Learn are ready; no game is retained for this new visitor.', check: async () => {
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Learn', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
  } }]);
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await steps.step('learn', 'Read the three phases of a turn', [{ spec: 'Action, Production, and Achievement are explained on the screen.', check: async () => {
    for (const name of ['Action', 'Production', 'Achievement']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  } }]);
  await page.getByRole('button', { name: 'Back to observatory' }).click();
  await steps.step('return', 'Return to the observatory', [{ spec: 'The guide closes and Play is ready.', check: async () => {
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled();
    await expect(page.getByRole('heading', { name: 'Production', exact: true })).toHaveCount(0);
  } }]);
});
