// Synthetic layout fixtures verify the guard, never a gameplay user story.
import {test,expect} from '@playwright/test';
import {assertTradeContainment} from '../e2e/helpers/trade-containment';
const fixture=(angle:number,top:number)=>`<style>
dialog{width:320px;height:280px;padding:0;overflow:visible;transform:rotate(${angle}deg)}
.instrument-frame{position:relative;height:280px;transform:scale(1.2)}
.decision-scroll{position:absolute;top:40px;width:100%;height:160px;overflow:visible}
.trade-boundary{position:relative;top:${top}px;width:185px;margin:0;font:16px/20px sans-serif}
footer{position:absolute;top:200px;width:100%;height:80px;background:#10262d}
</style><dialog class="turn-instrument shared angled" data-phase="trade"><div class="instrument-frame"><div class="decision-scroll"><p class="trade-boundary">Trade replaces production.</p></div><footer>Finish trading</footer></div></dialog>`;
for(const angle of [45,225]){
  test(`trade explanation clears the footer at ${angle} degrees`,async({page})=>{
    await page.setContent(fixture(angle,80));await page.locator('dialog').evaluate((el:HTMLDialogElement)=>el.showModal());
    await page.evaluate(assertTradeContainment);
  });
  test(`trade explanation hidden beneath the footer fails at ${angle} degrees`,async({page})=>{
    await page.setContent(fixture(angle,170));await page.locator('dialog').evaluate((el:HTMLDialogElement)=>el.showModal());
    await expect(page.evaluate(assertTradeContainment)).rejects.toThrow('Trade explanation runs beneath the turn footer');
  });
}
test('the cube inspector makes the background trade instrument inert',async({page})=>{
  await page.setContent(fixture(45,170)+'<dialog id="cycle">Your cube cycle</dialog>');
  await page.locator('.turn-instrument').evaluate((el:HTMLDialogElement)=>el.showModal());await page.locator('#cycle').evaluate((el:HTMLDialogElement)=>el.showModal());
  await page.evaluate(assertTradeContainment);
});
