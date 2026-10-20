/** Fully decode native candidates using the production exact comparator, without rewriting pixels. */
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {identicalPixels} from '../tests/e2e/helpers/exact-pixels.ts';
const report=JSON.parse(readFileSync('tmp/linux-reference-stage/manifest.json','utf8')) as {frames:{path:string;mac:string}[]};
for(const frame of report.frames){
 const native=readFileSync(frame.path),mac=readFileSync(frame.mac);
 if(!await identicalPixels(native,native))throw new Error('Invalid native PNG: '+frame.path);
 const a=await sharp(native).metadata(),b=await sharp(mac).metadata();
 if(a.width!==b.width||a.height!==b.height)throw new Error('Native viewport differs from reviewed story: '+frame.path);
}
console.log(`${report.frames.length} native PNGs fully decoded; paired viewport dimensions match. No pixels were transformed.`);
