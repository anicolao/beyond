import { test, expect } from '../helpers/fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
test('Join physical seats and arrange the shared table', async ({ page }, info) => {
  info.annotations.push({ type: 'viewports', description: 'desktop,tabletop-4k' }, { type: 'setup', description: 'One shared-display controller, four local players. Real Auth and Firestore emulators, ordinary UI joins, no injected room or event history. The same browser later narrows only at the retained entry to review its phone layout; all physical-table interaction remains at the original desktop/4K size.' });
  const steps = new TestStepHelper(page, info, info.title);
  const shot = (id: string, description: string, spec: string, check: () => Promise<unknown>) => steps.step(id, description, [{ spec, check }]);
  await page.goto('./');
  await shot('arrival', 'Arrive at the observatory', 'Play is connected and ready.', async () => { await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled(); });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await shot('mode', 'Choose one shared display', 'The shared table supports two to four local players.', async () => { await expect(page.getByRole('button', { name: /Shared table/ })).toContainText('2–4 players'); });
  await page.getByRole('button', { name: /Shared table/ }).click();
  await shot('empty-table', 'Join directly where you sit', 'Eight physical Join here controls surround the table, without invitation or save wizard.', async () => {
    await expect(page.getByRole('button', { name: /^Join at / })).toHaveCount(8);
    await expect(page.locator('main')).not.toContainText(/QR|scan|Save table|Your table is saved/i);
  });
  for (const [position, name] of [['South', 'Ada'], ['North', 'Bora'], ['East', 'Cleo'], ['North West', 'Dara']]) {
    const key = position.toLowerCase().replaceAll(' ', '-');
    await page.getByRole('button', { name: `Join at ${position}`, exact: true }).click();
    await shot(`${key}-editor`, `${name} opens the ${position} seat`, 'The name editor is at the chosen physical seat; joining needs a name.', async () => {
      await expect(page.getByLabel(`${position} player name`)).toHaveValue('');
      await expect(page.getByRole('button', { name: 'Join table', exact: true })).toBeDisabled();
    });
    await page.getByLabel(`${position} player name`).fill(name);
    await shot(`${key}-name`, `${name} enters a local name`, 'The name appears inline and Join table becomes available.', async () => {
      await expect(page.getByLabel(`${position} player name`)).toHaveValue(name);
      await expect(page.getByRole('button', { name: 'Join table', exact: true })).toBeEnabled();
    });
    await page.getByRole('button', { name: 'Join table', exact: true }).click();
    await shot(`${key}-joined`, `${name} joins the physical seat`, 'The committed name replaces that position’s Join here control.', async () => {
      await expect(page.getByRole('region', { name: `${position} seat`, exact: true }).getByRole('heading', { name, exact: true })).toBeVisible();
    });
  }
  await shot('capacity', 'Four players fill the table', 'Every remaining empty position rejects a fifth local player.', async () => {
    await expect(page.getByText('Table full', { exact: true })).toHaveCount(4);
    for (const button of await page.getByRole('button', { name: /^Join at / }).all()) await expect(button).toBeDisabled();
  });
  await page.getByRole('button', { name: 'Make Bora Player 1', exact: true }).click();
  await shot('first-player', 'Choose Bora as Player 1', 'The turn order begins at North then proceeds clockwise.', async () => {
    await expect(page.getByRole('list', { name: 'Clockwise turn order' }).getByRole('listitem')).toHaveText(['Bora · Player 1', 'Cleo', 'Ada', 'Dara']);
  });
  await page.getByRole('button', { name: 'Edit Ada', exact: true }).click();
  await shot('edit', 'Ada edits the occupied South seat', 'The editor retains the current name at that seat.', async () => { await expect(page.getByLabel('South player name')).toHaveValue('Ada'); });
  await page.getByLabel('South player name').fill('Ada Lovelace');
  await shot('renamed-entry', 'Enter the updated player name', 'The edited name is visible before committing.', async () => { await expect(page.getByLabel('South player name')).toHaveValue('Ada Lovelace'); });
  await page.getByRole('button', { name: 'Keep name', exact: true }).click();
  await shot('renamed', 'Keep Ada’s new name', 'The same occupied seat and order show the committed name.', async () => { await expect(page.getByRole('heading', { name: 'Ada Lovelace', exact: true })).toBeVisible(); });
  await page.getByRole('button', { name: 'Dara leaves table', exact: true }).click();
  await shot('leave', 'Dara leaves before setup begins', 'The North West position becomes joinable and three seats remain.', async () => {
    await expect(page.getByRole('button', { name: 'Join at North West', exact: true })).toBeEnabled();
    await expect(page.getByRole('heading', { name: 'Dara', exact: true })).toHaveCount(0);
  });
  const url = page.url();
  await page.reload();
  await shot('reload', 'Recover the same physical table', 'Server replay preserves names, positions, first player, removal, and table URL.', async () => {
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('list', { name: 'Clockwise turn order' }).getByRole('listitem')).toHaveText(['Bora · Player 1', 'Cleo', 'Ada Lovelace']);
    await expect(page.getByRole('button', { name: 'Join at North West', exact: true })).toBeEnabled();
  });
  await page.getByRole('button', { name: 'Back to observatory' }).click();
  await shot('continue', 'Find the table from the observatory', 'Continue is ready for the retained game.', async () => { await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled(); });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await shot('continued', 'Continue at the same seats', 'Continue reopens the same table URL and Player 1.', async () => {
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('list', { name: 'Clockwise turn order' }).getByRole('listitem').first()).toHaveText('Bora · Player 1');
  });
  await page.getByRole('button', { name: 'Back to observatory' }).click();
  await shot('resize-ready', 'Return to the retained entry before resizing', 'All three entry objects remain available for this existing table.', async () => {
    for (const name of ['Play','Learn','Continue']) await expect(page.getByRole('button', { name, exact: true })).toBeEnabled();
  });
  const originalViewport = page.viewportSize()!;
  await page.setViewportSize({ width: 393, height: 852 });
  await shot('narrow-retained-entry', 'Keep Continue when the same browser narrows to phone width', 'The three entry discs stack without clipping at 393 × 852; resizing adds no device or player.', async () => {
    const buttons = [];
    for (const name of ['Play','Learn','Continue']) {
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toBeEnabled(); buttons.push((await button.boundingBox())!);
    }
    expect(buttons[1].y).toBeGreaterThan(buttons[0].y + buttons[0].height);
    expect(buttons[2].y).toBeGreaterThan(buttons[1].y + buttons[1].height);
  });
  await page.setViewportSize(originalViewport);
  await shot('wide-retained-entry', 'Widen the same retained browser again', 'Continue stays available at the original shared-display size.', async () => {
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await shot('responsive-continued', 'Reopen the same table after resizing', 'The same URL, names and Player 1 survive the entry layout change.', async () => {
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('list', { name: 'Clockwise turn order' }).getByRole('listitem')).toHaveText(['Bora · Player 1', 'Cleo', 'Ada Lovelace']);
  });
});
