// Synthetic DOM fixtures test the capture guard itself, not a game user story.
import { test, expect } from '@playwright/test';
import { assertScreenFit, warmVisibleImages } from '../e2e/helpers/screen-fit';
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

// Combined preparation retains the same capture contract before the geometry pass.
for(const state of ['missing','active','settled','small'] as const)test(`combined preparation ${state}`,async({page})=>{
 await page.setContent(`<main data-e2e-layout><button style="width:${state==='small'?43:80}px;height:44px;padding:0">Go</button></main>`);
 if(state!=='missing')await page.evaluate(active=>{(window as Window&{__beyondTransitions?:Map<Element,string>}).__beyondTransitions=active?new Map([[document.querySelector('button')!,'intro']]):new Map();},state==='active');
 const result=page.evaluate(assertScreenFit,{prepare:true,touchTargets:true});
 if(state==='settled')await result;
 else await expect(result).rejects.toThrow(state==='small'?'Touch target too small':'Svelte transition');
});
for(const width of [60,220])test(`nested transformed clipping ${width===60?'fits':'fails'}`,async({page})=>{
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0}main{position:absolute;left:200px;top:100px;transform:scale(.9) rotate(15deg);width:300px;height:300px}.clip{width:160px;height:130px;overflow:hidden;border:1px solid;transform:scale(.8)}span{display:block;margin:20px;width:${width}px;height:40px;background:ivory}</style><main data-e2e-layout><div class="clip"><span>Source</span></div></main>`);
 const result=page.evaluate(assertScreenFit,{});
 if(width===60)await result;else await expect(result).rejects.toThrow('clipped by div');
});

// Warming must never replace final validation of images appearing after an ack.
const imageSource='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="ivory"/></svg>');
test('image warming preserves a fresh native decode of every current late image',async({page})=>{
 await page.setContent(`<main data-e2e-layout><img id="first" alt="" width="48" height="48" src="${imageSource}"></main>`);
 await page.evaluate(()=>{(window as Window&{__beyondTransitions?:Map<Element,string>}).__beyondTransitions=new Map();const native=HTMLImageElement.prototype.decode;(window as Window&{decoded?:string[]}).decoded=[];HTMLImageElement.prototype.decode=function(){(window as Window&{decoded?:string[]}).decoded!.push(this.id);return native.call(this);};});
 await page.evaluate(warmVisibleImages);
 await page.evaluate(()=>{const late=document.querySelector('img')!.cloneNode() as HTMLImageElement;late.id='late';document.querySelector('main')!.append(late);});
 await page.evaluate(assertScreenFit,{prepare:true});
 expect(await page.evaluate(()=>(window as Window&{decoded?:string[]}).decoded)).toEqual(['first','first','late']);
});
test('successful warming cannot hide an undecodable image added before the final audit',async({page})=>{
 await page.setContent(`<main data-e2e-layout><img alt="" width="48" height="48" src="${imageSource}"></main>`);
 await page.evaluate(()=>{(window as Window&{__beyondTransitions?:Map<Element,string>}).__beyondTransitions=new Map();});
 await page.evaluate(warmVisibleImages);
 await page.evaluate(()=>{const late=document.createElement('img');late.width=48;late.height=48;late.src='data:image/png;base64,broken';document.querySelector('main')!.append(late);});
 await expect(page.evaluate(assertScreenFit,{prepare:true})).rejects.toThrow(/decoded/);
});

test('combined acknowledgement defers audit until the exact requested status',async({page})=>{
 await page.setContent('<main data-e2e-layout data-backend-status="reconnecting"><button style="width:80px;height:44px">Go</button></main>');
 await page.evaluate(()=>{(window as Window&{__beyondTransitions?:Map<Element,string>}).__beyondTransitions=new Map();});
 expect(await page.evaluate(assertScreenFit,{status:'synced',prepare:true,touchTargets:true})).toBe(false);
 await page.locator('main').evaluate(element=>element.setAttribute('data-backend-status','synced'));
 expect(await page.evaluate(assertScreenFit,{status:'synced',prepare:true,touchTargets:true})).toBe(true);
 expect(await page.evaluate(assertScreenFit,{status:'offline'})).toBe(false);
});
test('acknowledgement polling propagates a real audit failure without retrying it',async({page})=>{
 await page.setContent('<main data-e2e-layout data-backend-status="synced"><button style="width:43px;height:44px;padding:0">Go</button></main>');
 await page.evaluate(()=>{(window as Window&{__beyondTransitions?:Map<Element,string>}).__beyondTransitions=new Map();});
 await expect(page.waitForFunction(assertScreenFit,{status:'synced',prepare:true,touchTargets:true},{timeout:2000,polling:20})).rejects.toThrow('Touch target too small');
});
