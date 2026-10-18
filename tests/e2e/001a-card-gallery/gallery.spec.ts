import { test, expect } from '../helpers/fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
test('Explore source-reviewed card faces and representative public states', async ({ page }, info) => {
  info.annotations.push({ type: 'viewports', description: 'phone,desktop,desktop-compact,tabletop-4k' }, { type: 'setup', description: 'One visitor follows ordinary arrival navigation, with anonymous Auth and Firestore emulators. The gallery is a public reference document on each display, not remote PvP or a tabletop companion. Six reviewed definitions and explicitly labelled visual fixtures; no game creation, injected game state, random deck, or gameplay commands.' });
  const steps = new TestStepHelper(page, info, info.title);
  const photo = (id: string, caption: string, spec: string, check: () => Promise<void>) => steps.step(id, caption, [{ spec, check }], { document: true, player: 'Gallery visitor' });
  const dialog = page.getByRole('dialog', { name: 'Card inspection' });
  await page.goto('./');
  await photo('arrival', 'Find the card collection from the observatory', 'The gallery is reachable without creating a game.', async () => {
    await expect(page.getByRole('link', { name: 'Card gallery' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled();
  });
  await page.getByRole('link', { name: 'Card gallery' }).click();
  await photo('collection', 'Browse a source-reviewed reference collection', 'Six semantic card faces are separate from live games and future draws.', async () => {
    await expect(page.getByRole('heading', { name: 'Card gallery', exact: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(6);
    await expect(page.getByRole('status')).toHaveText('6 of 6 cards');
    await expect(page.getByText('Visual reference collection.', { exact: true })).toBeVisible();
  });
  await page.getByRole('button', { name: 'Technology', exact: true }).click();
  await photo('technology', 'Focus the collection on technologies', 'The two scientific cards have separate immediate bonuses, costs and action text.', async () => {
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Technology', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('4 Ore + 1 Population', { exact: false })).toBeVisible();
  });
  await page.getByRole('button', { name: 'Inspect Hypercomputing' }).click();
  await photo('inspect-technology', 'Read Hypercomputing at inspection scale', 'The complete face shows the one-time bonus, research cost, action and scoring.', async () => {
    await expect(dialog).toBeVisible(); await expect(dialog.getByRole('heading', { name: 'Hypercomputing', exact: true })).toBeVisible();
    await expect(dialog.getByText('Automate 1 Ore production.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Research a Level III technology.', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close inspection' })).toBeFocused();
  });
  await page.keyboard.press('Shift+Tab');
  await photo('focus-wrap-backward', 'Keep reverse keyboard navigation inside the inspector', 'Shift+Tab from Close wraps to the final enabled navigation control.', async () => { await expect(dialog.getByRole('button', { name: 'Next card' })).toBeFocused(); });
  await page.keyboard.press('Tab');
  await photo('focus-wrap-forward', 'Keep forward keyboard navigation inside the inspector', 'Tab from the final navigation control wraps to Close instead of escaping the dialog.', async () => { await expect(dialog.getByRole('button', { name: 'Close inspection' })).toBeFocused(); });
  await dialog.getByRole('region', { name: 'Card face and source details' }).click();
  await photo('focus-details', 'Reach the labelled card-details scroll region', 'The card/details area is keyboard reachable while navigation stays outside it.', async () => { await expect(dialog.getByRole('region', { name: 'Card face and source details' })).toBeFocused(); });
  await page.keyboard.press('End');
  await photo('scroll-details', 'Read the end of the card details with navigation still in reach', 'End reaches the details limit; Close and Previous/Next stay within the viewport.', async () => {
    await expect.poll(() => dialog.getByRole('region', { name: 'Card face and source details' }).evaluate(e => Math.abs(e.scrollHeight - e.clientHeight - e.scrollTop) < 1)).toBe(true);
    for (const name of ['Close inspection', 'Previous card', 'Next card']) {
      const box = (await dialog.getByRole('button', { name }).boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    }
  });
  await dialog.getByRole('button', { name: 'Next card' }).click();
  await photo('next-technology', 'Inspect a technology with no action space', 'Advanced Robotics has an immediate bonus and no invented action.', async () => {
    await expect(dialog.getByRole('heading', { name: 'Advanced Robotics', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Action', exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Next card' })).toBeDisabled();
  });
  await page.keyboard.press('Escape');
  await photo('restore-focus', 'Return to the source card with Escape', 'Closing restores keyboard focus to the original inspection control.', async () => {
    await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button', { name: 'Inspect Hypercomputing' })).toBeFocused();
  });
  await page.getByRole('combobox', { name: 'Presentation', exact: true }).selectOption('true');
  await photo('markers', 'Compare labelled visual state on the same renderers', 'Researchers and action occupancy are distinct, fictional examples.', async () => {
    await expect(page.getByText('Action occupied · Ada', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Card collection' }).getByText('Researched', { exact: true })).toHaveCount(2);
  });
  await page.getByRole('button', { name: 'Inspect Hypercomputing' }).click();
  await photo('inspect-markers', 'Inspect researchers and an occupied action', 'Two named research cubes remain separate from Ada’s action pawn.', async () => {
    await expect(dialog.getByText('Action occupied · Ada', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Bora', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Visual fixture · example markers', { exact: false })).toBeVisible();
  });
  await dialog.getByRole('button', { name: 'Close inspection' }).click();
  await photo('close-markers', 'Close inspection without changing the fixture', 'The example presentation remains selected.', async () => { await expect(dialog).not.toBeVisible(); await expect(page.getByRole('combobox', { name: 'Presentation', exact: true })).toHaveValue('true'); });
  await page.getByRole('button', { name: 'Event', exact: true }).click();
  await photo('event', 'Filter to the fixed Level III event', 'The event family contains KC-24X and no concealed live event.', async () => { await expect(page.getByRole('article')).toHaveCount(1); await expect(page.getByRole('heading', { name: 'KC-24X', exact: true })).toBeVisible(); });
  await page.getByRole('button', { name: 'Inspect KC-24X' }).click();
  await photo('inspect-event', 'Read the longer event text and retained reward', 'The reveal effect, shared guild access, retention and point value are readable.', async () => {
    await expect(dialog.getByText('Remove a Tier 2 Guild cover below Basic Spacefaring. All factions can use the uncovered action.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Retain this event in front of you; it scores 1 point.', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Rules source/ })).toHaveAttribute('href', /Combined.pdf#page=5$/);
  });
  await dialog.getByRole('button', { name: 'Close inspection' }).click();
  await photo('close-event', 'Return to the event collection', 'The event filter and source inspection control are retained.', async () => { await expect(page.getByRole('button', { name: 'Inspect KC-24X' })).toBeFocused(); });
  await page.getByRole('button', { name: 'System', exact: true }).click();
  await photo('system', 'Review a starting System with a colony example', 'Barnard’s Star shows a named colony with two production discs.', async () => { await expect(page.getByText('Colony · Ada', { exact: true })).toBeVisible(); await expect(page.getByRole('article')).toHaveCount(1); });
  await page.getByRole('button', { name: 'Inspect Barnard’s Star' }).click();
  await photo('inspect-system', 'Read control, settlement and scoring separately', 'The food specialty, 3-power settlement cost and 5-point colony value are visible.', async () => { await expect(dialog.getByText('Food production.', { exact: true })).toBeVisible(); await expect(dialog.getByText('3 military power', { exact: false })).toBeVisible(); await expect(dialog.getByText('5 VP', { exact: true })).toBeVisible(); });
  await page.keyboard.press('Escape');
  await photo('close-system', 'Return from the System face', 'The original System inspection control has focus.', async () => { await expect(page.getByRole('button', { name: 'Inspect Barnard’s Star' })).toBeFocused(); });
  await page.getByRole('button', { name: 'Achievement', exact: true }).click();
  await photo('achievements', 'Compare achievement requirements and claim slots', 'The two achievements show source-backed rewards and Ada’s example first claim.', async () => { await expect(page.getByRole('article')).toHaveCount(2); await expect(page.getByText('Ada · 4 VP', { exact: true })).toBeVisible(); await expect(page.getByText('Ada · 3 VP', { exact: true })).toBeVisible(); });
  await page.getByRole('combobox', { name: 'Players', exact: true }).selectOption('3');
  await photo('three-players', 'Apply the three-player achievement restriction', 'Technologist’s second slot is explicitly unavailable in a three-player reference.', async () => { await expect(page.getByText('4 players only', { exact: true })).toBeVisible(); });
  await page.getByRole('button', { name: 'Inspect Technologist' }).click();
  await photo('inspect-achievement', 'Inspect the restricted achievement at full size', 'The requirement excludes personal technologies and the blocked second slot stays visible.', async () => { await expect(dialog.getByText('Research all 6 Level II technologies. Personal technologies do not count.', { exact: true })).toBeVisible(); await expect(dialog.getByText('4 players only', { exact: true })).toBeVisible(); });
  await page.keyboard.press('Escape');
  await photo('close-achievement', 'Restore the achievement inspection source', 'Keyboard focus returns to Technologist.', async () => { await expect(page.getByRole('button', { name: 'Inspect Technologist' })).toBeFocused(); });
  await page.getByLabel('Search cards', { exact: true }).fill('no-matching-card');
  await photo('empty-search', 'See an informative empty search result', 'No match produces a clear explanation and no card faces.', async () => { await expect(page.getByRole('status')).toHaveText('0 of 6 cards'); await expect(page.getByText('No cards match. Change your search or reset the filters.', { exact: true })).toBeVisible(); });
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await photo('reset', 'Restore the full collection', 'Reset clears the search and family while preserving the chosen presentation.', async () => { await expect(page.getByRole('article')).toHaveCount(6); await expect(page.getByLabel('Search cards', { exact: true })).toHaveValue(''); await expect(page.getByRole('combobox', { name: 'Presentation', exact: true })).toHaveValue('true'); });
  await page.getByRole('link', { name: 'Observatory' }).click();
  await photo('return-home', 'Return to the accepted observatory', 'Play and Learn remain available and browsing has created no retained game.', async () => { await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0); });
});
