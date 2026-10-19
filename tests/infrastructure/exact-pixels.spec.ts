import {test,expect} from '@playwright/test';
import sharp from 'sharp';
import {identicalPixels,preparePixels} from '../e2e/helpers/exact-pixels';
const rgba=()=>Buffer.from(Array.from({length:8*8},()=>[20,90,130,255]).flat());
const png=(pixels=rgba(),compressionLevel=6)=>sharp(pixels,{raw:{width:8,height:8,channels:4}}).png({compressionLevel}).toBuffer();
test('identical valid PNGs pass after reference validation, including prepared references',async()=>{
 const image=await png();expect(await identicalPixels(image,image)).toBe(true);expect(await identicalPixels(Buffer.from(image),preparePixels(image))).toBe(true);
});
test('different PNG encodings with identical RGBA still pass native comparison',async()=>{
 const a=await png(rgba(),0),b=await png(rgba(),9);expect(a.equals(b)).toBe(false);expect(await identicalPixels(a,b)).toBe(true);
});
for(const channel of [0,3])test(`one changed ${channel===3?'alpha':'color'} byte fails exact comparison`,async()=>{
 const changed=rgba();changed[channel]--;expect(await identicalPixels(await png(changed),await png())).toBe(false);
});
test('equal pixel counts with different dimensions fail',async()=>{
 const other=await sharp(rgba(),{raw:{width:4,height:16,channels:4}}).png().toBuffer();expect(await identicalPixels(other,await png())).toBe(false);
});
test('identical malformed bytes cannot bypass native validation',async()=>{
 const invalid=Buffer.from('not a PNG');await expect(identicalPixels(invalid,invalid)).rejects.toThrow();await expect(identicalPixels(invalid,preparePixels(invalid))).rejects.toThrow();
});
