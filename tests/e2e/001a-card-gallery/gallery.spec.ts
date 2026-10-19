import { test, expect } from '../helpers/fixtures';
import checklist from '../../../docs/content/second-printing-card-inventory.json' with {type:'json'};
import { TestStepHelper } from '../helpers/test-step-helper';
test('Explore source-reviewed card faces and representative public states', async ({ page }, info) => {
  info.annotations.push({ type: 'viewports', description: 'phone,desktop,desktop-compact,tabletop-4k' }, { type: 'setup', description: 'One visitor follows ordinary arrival navigation, with anonymous Auth and Firestore emulators. The gallery is a public reference document on each display, not remote PvP or a tabletop companion. Complete100-design/100-copy source-verified base inventory, with complete original project art, and separately labelled presentation markers; Mechanical paraphrases retain the documented WISE physical second-print title/verbatim-wording limitation; no definitive edition-face equality is claimed. No game creation, injected game state, random deck, or gameplay commands.' });
  const steps = new TestStepHelper(page, info, info.title);
  const photo = (id: string, caption: string, spec: string, check: () => Promise<void>) => steps.step(id, caption, [{ spec, check }], { document: true, player: 'Gallery visitor' });
  const dialog = page.getByRole('dialog', { name: 'Card inspection' });
  await page.goto('./');
  await photo('arrival', 'Find the card collection from the observatory', 'The gallery is reachable without creating a game.', async () => {
    await expect(page.getByRole('link', { name: 'Card gallery' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled();
  });
  await page.getByRole('link', { name: 'Card gallery' }).click();
  await photo('collection', 'Browse a source-reviewed reference collection', 'All100 canonical designs are browsable in pages, separate from live games and future draws.', async () => {
    await expect(page.getByRole('heading', { name: 'Card gallery', exact: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(6);
    await expect(page.getByRole('status')).toHaveText('100 of 100 designs · 100 copies');
    await expect(page.getByRole('navigation',{name:'Collection pages'}).getByRole('button',{name:'Previous page'})).toBeDisabled();
    await expect(page.getByText('Visual reference collection.', { exact: true })).toBeVisible();
  });
  const found=new Set<string>();let copies=0;
  for(let number=1;number<=17;number++){
    if(number>1)await page.getByRole('navigation',{name:'Collection pages'}).getByRole('button',{name:'Next page',exact:false}).click();
    await photo(`inventory-page-${number}`,`Review base inventory page ${number} of17`,'Each canonical design occurs once, with a source-backed physical-copy quantity.',async()=>{
      await expect(page.getByText(`Page ${number} of 17`,{exact:true})).toBeVisible();
      const cards=page.locator('#collection .specimen');await expect(cards).toHaveCount(number===17?4:6);
      for(const card of await cards.all()){const id=(await card.getAttribute('id'))!;expect(found.has(id)).toBe(false);found.add(id);const quantity=Number((await card.locator('.specimen-caption').innerText()).match(/(\d+) physical cop/)![1]);expect(quantity).toBe(checklist.cards.find(c=>c.id===id)!.copies);copies+=quantity;await expect(card.locator('.art-pending')).toHaveCount(0);await expect(card.locator('.illustration > img, .illustration > svg')).toHaveCount(1);}
    });
  }
  expect([...found].sort()).toEqual(checklist.cards.map(c=>c.id).sort());expect(copies).toBe(100);
  await expect(page.getByRole('navigation',{name:'Collection pages'}).getByRole('button',{name:'Next page'})).toBeDisabled();
  await page.getByRole('button', { name: 'Technology', exact: true }).click();
  await photo('technology', 'Focus the collection on technologies', 'All46 technologies are available through eight pages, with complete type directions, bonuses, costs and actions.', async () => {
    await expect(page.getByRole('article')).toHaveCount(6);
    await expect(page.getByRole('button', { name: 'Technology', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('4 Ore + 1 Population', { exact: false })).toBeVisible();
    await expect(page.getByRole('article').filter({has:page.getByRole('heading',{name:'Advanced Robotics',exact:true})}).getByRole('heading',{name:'Action',exact:true})).toHaveCount(0);
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
  await photo('next-technology', 'Inspect a technology with two actions', 'Human Experiments preserves its immediate upgrade and two separate action/cost groups.', async () => {
    await expect(dialog.getByRole('heading', { name: 'Human Experiments', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Action', exact: true })).toHaveCount(2);
    await expect(dialog.getByRole('button', { name: 'Next card' })).toBeEnabled();
  });
  await page.keyboard.press('Escape');
  await photo('restore-focus', 'Return to the source card with Escape', 'Closing restores keyboard focus to the original inspection control.', async () => {
    await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button', { name: 'Inspect Hypercomputing' })).toBeFocused();
  });
  await page.getByRole('combobox', { name: 'Presentation', exact: true }).selectOption('true');
  await photo('markers', 'Compare labelled visual state on the same renderers', 'Researchers and action occupancy are distinct, fictional examples.', async () => {
    await expect(page.getByText('Action occupied · Ada', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Card collection' }).getByText('Researched', { exact: true })).toHaveCount(6);
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
  await photo('event', 'Browse all20 base Events', 'The public reference catalog includes both levels and fixed events, without exposing a live game’s event order.', async () => { await expect(page.getByRole('article')).toHaveCount(6); await expect(page.getByRole('status')).toHaveText('20 of 100 designs · 20 copies'); });
  await page.getByLabel('Search cards',{exact:true}).fill('KC-24X');
  await photo('find-fixed-event','Find a fixed Event by canonical identity','Search covers every card beyond the current collection page.',async()=>{await expect(page.getByRole('article')).toHaveCount(1);await expect(page.getByRole('heading',{name:'KC-24X',exact:true})).toBeVisible();});
  await page.getByRole('button', { name: 'Inspect KC-24X' }).click();
  await photo('inspect-event', 'Read the longer event text and retained reward', 'The reveal effect, shared guild access, retention and point value are readable.', async () => {
    await expect(dialog.getByText('Choose a covered Tier 2 Guild and remove its cover. Its action becomes available to every faction.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Retain this Event in front of your faction.', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Rules source/ })).toHaveAttribute('href', /Combined.pdf#page=5$/);
    await expect(dialog.getByRole('button',{name:'Previous card'})).toBeDisabled();await expect(dialog.getByRole('button',{name:'Next card'})).toBeDisabled();
  });
  await dialog.getByRole('button', { name: 'Close inspection' }).click();
  await photo('close-event', 'Return to the event collection', 'The event filter and source inspection control are retained.', async () => { await expect(page.getByRole('button', { name: 'Inspect KC-24X' })).toBeFocused(); });
  await page.getByLabel('Search cards',{exact:true}).fill('');
  await photo('clear-event-search','Restore the Event family','Clearing search restores all20 Event designs.',async()=>{await expect(page.getByRole('status')).toHaveText('20 of 100 designs · 20 copies');});
  await page.getByRole('button', { name: 'System', exact: true }).click();
  await photo('system', 'Review a starting System with a colony example', 'Barnard’s Star shows a named colony with two production discs.', async () => { await expect(page.getByRole('article').filter({has:page.getByRole('heading',{name:'Barnard’s Star',exact:true})}).getByText('Colony · Ada',{exact:true})).toBeVisible(); await expect(page.getByRole('article')).toHaveCount(6); await expect(page.getByRole('status')).toHaveText('24 of 100 designs · 24 copies'); });
  await page.getByRole('button', { name: 'Inspect Barnard’s Star' }).click();
  await photo('inspect-system', 'Read control, settlement and scoring separately', 'The food specialty, 3-power settlement cost and 5-point colony value are visible.', async () => { await expect(dialog.getByText('Food production.', { exact: true })).toBeVisible(); await expect(dialog.getByText('3 military power', { exact: false })).toBeVisible(); await expect(dialog.getByText('5 VP', { exact: true })).toBeVisible(); });
  await page.keyboard.press('Escape');
  await photo('close-system', 'Return from the System face', 'The original System inspection control has focus.', async () => { await expect(page.getByRole('button', { name: 'Inspect Barnard’s Star' })).toBeFocused(); });
  await page.getByRole('button', { name: 'Achievement', exact: true }).click();
  await photo('achievements', 'Compare achievement requirements and claim slots', 'All10 achievements are present with source-backed rewards and separate example claims.', async () => { await expect(page.getByRole('article')).toHaveCount(6); await expect(page.getByRole('status')).toHaveText('10 of 100 designs · 10 copies'); await expect(page.getByText('Ada · 4 VP', { exact: true })).toHaveCount(2); await expect(page.getByText('Ada · 3 VP', { exact: true })).toHaveCount(4); });
  await page.getByRole('combobox', { name: 'Players', exact: true }).selectOption('3');
  await photo('three-players', 'Apply the three-player achievement restriction', 'Technologist’s second slot is explicitly unavailable in a three-player reference.', async () => { await expect(page.getByText('4 players only', { exact: true })).toHaveCount(4); });
  await page.getByRole('button', { name: 'Inspect Technologist' }).click();
  await photo('inspect-achievement', 'Inspect the restricted achievement at full size', 'The requirement excludes personal technologies and the blocked second slot stays visible.', async () => { await expect(dialog.getByText('Research all 6 Level II technologies. Personal technologies do not count.', { exact: true })).toBeVisible(); await expect(dialog.getByText('4 players only', { exact: true })).toBeVisible(); });
  await page.keyboard.press('Escape');
  await photo('close-achievement', 'Restore the achievement inspection source', 'Keyboard focus returns to Technologist.', async () => { await expect(page.getByRole('button', { name: 'Inspect Technologist' })).toBeFocused(); });
  await page.getByLabel('Search cards', { exact: true }).fill('no-matching-card');
  await photo('empty-search', 'See an informative empty search result', 'No match produces a clear explanation and no card faces.', async () => { await expect(page.getByRole('status')).toHaveText('0 of 100 designs · 0 copies'); await expect(page.getByText('No cards match. Change your search or reset the filters.', { exact: true })).toBeVisible(); });
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await photo('reset', 'Restore the full collection', 'Reset clears the search and family while preserving the chosen presentation.', async () => { await expect(page.getByRole('article')).toHaveCount(6); await expect(page.getByLabel('Search cards', { exact: true })).toHaveValue(''); await expect(page.getByRole('combobox', { name: 'Presentation', exact: true })).toHaveValue('true'); });
  await page.getByRole('combobox',{name:'Players',exact:true}).selectOption('4');
  await photo('four-player-fixture','Restore four-player reference capacity','Four-player rewards are available without creating a live game.',async()=>{await expect(page.getByRole('combobox',{name:'Players',exact:true})).toHaveValue('4');});
  await page.getByRole('combobox',{name:'Presentation',exact:true}).selectOption('full');
  await photo('full-markers','Show a crowded but explicitly fictional public tableau','Technology cards show four named researchers; only printed action-bearing cards have an occupied-action example.',async()=>{await expect(page.locator('#human-experiments .researcher')).toHaveCount(4);await expect(page.locator('#advanced-robotics .occupied')).toHaveCount(0);});
  await page.getByRole('button',{name:'Achievement',exact:true}).click();
  await photo('full-claim-slots','Review complete four-player claim rows','Basic achievements show four distinct named claimants and A achievements show both valid claimants.',async()=>{await expect(page.locator('#transcendence .claimed')).toHaveCount(4);await expect(page.locator('#transcendence .reward-disc')).toHaveText(['A','B','C','D']);await expect(page.locator('#technologist .claimed')).toHaveCount(2);});
  await page.getByRole('combobox',{name:'Players',exact:true}).selectOption('3');
  await photo('full-three-player-slots','Retain the three-player restriction in crowded fixtures','The unavailable second A slot is never occupied; Basic rewards contain only three example claimants.',async()=>{await expect(page.locator('#transcendence .claimed')).toHaveCount(3);await expect(page.locator('#technologist .claimed')).toHaveCount(1);await expect(page.locator('#technologist .unavailable')).toHaveCount(1);});
  await page.getByRole('combobox',{name:'Players',exact:true}).selectOption('4');
  await photo('full-four-player-slots','Restore all four-player reference slots','Both A slots are again available and visibly occupied in this optional fixture.',async()=>{await expect(page.locator('#technologist .claimed')).toHaveCount(2);await expect(page.locator('#technologist .unavailable')).toHaveCount(0);});
  await page.getByRole('button',{name:'All cards',exact:true}).click();
  await photo('full-all-cards','Return to the complete full-marker collection','All100 canonical designs and100 copies remain available for long-face inspection.',async()=>{await expect(page.getByRole('status')).toHaveText('100 of 100 designs · 100 copies');});
  for(const face of[
    {id:'human-experiments',title:'Human Experiments',claim:'Four researchers and an occupied action coexist with both complete research/ship costs.',researchers:4},
    {id:'ministry-of-colonies',title:'Ministry of Colonies',claim:'The complete Level IIII colony-draw effect and scoring fit alongside four researchers.',researchers:4},
    {id:'mass-enlightenment',title:'Mass Enlightenment',claim:'Final-round restriction, extra public technology and achievement exclusion remain complete.',researchers:0},
    {id:'dyson-sphere-mk-i',title:'Dyson Sphere, Mk. I',claim:'The shared action retains5 Ore and3 returned Population, its delayed availability and all settlement exceptions.',researchers:0},
    {id:'luytens-star',title:'Luyten’s Star',claim:'The entry restriction remains separate from colonization, with two colony production markers.',researchers:0},
    {id:'specialization',title:'Specialization',claim:'The full requirement includes printed specialties, hybrid Systems and shipyards beside the claim reward.',researchers:0}
  ]){
    await page.getByLabel('Search cards',{exact:true}).fill(face.id);
    await photo(`find-${face.id}`,`Find ${face.title} in the complete inventory`,'Canonical identity search returns exactly one original illustrated face.',async()=>{await expect(page.locator('#collection .specimen')).toHaveCount(1);await expect(page.locator(`#${face.id} .card-face`)).toHaveAttribute('aria-label',new RegExp(face.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));});
    const origin=page.getByRole('button',{name:`Inspect ${face.title}`,exact:true});await origin.click();
    await photo(`full-${face.id}`,`Inspect ${face.title} with full public markers`,face.claim,async()=>{await expect(dialog.getByRole('heading',{name:face.title,exact:true})).toBeVisible();await expect(dialog.locator('.researcher')).toHaveCount(face.researchers);expect(await dialog.getByRole('region',{name:'Card face and source details'}).evaluate(e=>e.scrollTop)).toBe(0);await expect(dialog.locator('.art-pending')).toHaveCount(0);await expect(dialog.locator('.card-face')).toHaveCount(1);if(face.id==='human-experiments'){await expect(dialog.locator('.occupied')).toHaveCount(1);await expect(dialog.getByRole('heading',{name:'Action',exact:true})).toHaveCount(2);}if(face.id==='specialization')await expect(dialog.getByText(/shipyards also count/)).toHaveCount(1);});
    await dialog.getByRole('region',{name:'Card face and source details'}).press('End');
    await photo(`read-${face.id}`,`Read the end of ${face.title} without losing navigation`,'The complete card/source is reachable; Close and Previous/Next stay within the viewport.',async()=>{await expect.poll(()=>dialog.getByRole('region',{name:'Card face and source details'}).evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<1)).toBe(true);for(const name of ['Close inspection','Previous card','Next card']){const box=(await dialog.getByRole('button',{name}).boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize()!.height);}});
    await page.keyboard.press('Escape');
    await photo(`return-${face.id}`,`Return from ${face.title}`,'Escape restores the actual source control without changing filters or fictional presentation.',async()=>{await expect(origin).toBeFocused();await expect(page.getByRole('combobox',{name:'Presentation',exact:true})).toHaveValue('full');});
  }
  await page.getByRole('link', { name: 'Observatory' }).click();
  await photo('return-home', 'Return to the accepted observatory', 'Play and Learn remain available and browsing has created no retained game.', async () => { await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0); });
});
