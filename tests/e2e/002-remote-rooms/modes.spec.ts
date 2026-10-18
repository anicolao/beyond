import { test, expect } from '../helpers/fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';

test('Choose a gathering mode through tactile keyboard-accessible instruments', async ({ page }, info) => {
  info.annotations.push({ type:'viewports', description:'phone,desktop,tabletop-4k' }, { type:'setup', description:'One visitor uses the ordinary production arrival and mode instruments on phone, desktop and a full 3840×2160 shared display. Auth and Firestore emulators; no room, faction, deck or game state is injected. Tabletop seating itself remains covered by the existing single-controller physical-seat story.' });
  const steps = new TestStepHelper(page, info, info.title);
  const photo = (id:string, caption:string, check:()=>Promise<unknown>) => steps.step(id,caption,[{spec:caption,check}],{player:'Visitor choosing a display mode'});
  const shared = page.getByRole('button',{name:/Shared table/});
  const create = page.getByRole('link',{name:'Create a remote room',exact:true});
  const join = page.getByRole('link',{name:'Join by code',exact:true});
  await page.goto('./');
  await photo('arrival','The visitor starts at the observatory',async()=>expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled());
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await photo('mode-instruments','Three balanced table instruments distinguish local and remote play',async()=>{
    await expect(shared).toContainText('2–4 players · One shared display');
    await expect(create).toContainText('Host friends on their own screens');
    await expect(join).toContainText('Enter a remote room’s invitation');
    // Compare layout dimensions in one frame; a pointer-hover translation can
    // introduce fractional DOMRect rounding without changing an object's size.
    const sizes=await page.getByRole('navigation',{name:'Choose how to play'}).locator('button,a').evaluateAll(controls=>controls.map(control=>({width:getComputedStyle(control).width,height:getComputedStyle(control).height})));
    expect(sizes.every(size=>size.width===sizes[0].width && size.height===sizes[0].height)).toBe(true);
  });
  await page.keyboard.press('Tab');
  await photo('shared-keyboard','The shared-display instrument receives visible keyboard focus',async()=>expect(shared).toBeFocused());
  await page.keyboard.press('Tab');
  await photo('create-keyboard','The remote-host instrument follows in keyboard order',async()=>expect(create).toBeFocused());
  await page.keyboard.press('Tab');
  await photo('join-keyboard','The invitation instrument is separately reachable',async()=>expect(join).toBeFocused());
  await page.keyboard.press('Enter');
  await photo('join-form','Keyboard activation opens the real code-entry instrument',async()=>{await expect(page.getByRole('heading',{name:'Find your room',exact:true})).toBeVisible(); await expect(page.getByRole('textbox',{name:'Invitation code',exact:true})).toBeVisible();});
  await page.getByRole('link',{name:'Observatory'}).click();
  await photo('return-arrival','Return from code entry without creating a room',async()=>expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0));
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await photo('mode-return','The same three production choices remain available',async()=>{await expect(shared).toBeEnabled();await expect(create).toBeVisible();await expect(join).toBeVisible();});
  await create.click();
  await photo('host-form','Remote creation opens the actual name and configuration controls',async()=>{await expect(page.getByRole('textbox',{name:'Your name',exact:true})).toBeVisible();await expect(page.getByRole('combobox',{name:'Players',exact:true})).toHaveValue('2');await expect(page.getByRole('button',{name:'Create room',exact:true})).toBeDisabled();});
  await page.getByRole('link',{name:'Observatory'}).click();
  await photo('finish','Leaving an unsubmitted host form creates no retained game',async()=>{await expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);});
});
