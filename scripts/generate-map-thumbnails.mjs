import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {systemCards} from '../src/lib/cards/system-cards.ts';

// Decorative map badges use the same original artwork as their full-size card.
// Pre-filter at the actual content size: a 1536px image drawn into a23px badge
// otherwise admits different cached resampling results during layout changes.
const names=[...new Set(systemCards.flatMap(card=>card.art&&card.art!=='astronomy'?[card.art]:[]))].sort();
const directory='static/art/card-thumbnails';await mkdir(directory,{recursive:true});
const derivatives=[];
for(const art of names){
 if(!/^[a-z0-9-]+$/.test(art))throw Error('Expected a canonical original-art asset key');
 const source=`static/art/cards/${art}.png`,buffer=await readFile(source),sourceSha256=createHash('sha256').update(buffer).digest('hex');
 for(const contentWidth of[20,23])for(const density of[1,2,3]){
  const width=contentWidth*density,height=12*density,path=`${directory}/${art}-${width}x${height}.png`;
  const image=await sharp(buffer).resize(width,height,{fit:'cover',position:'centre',kernel:sharp.kernel.lanczos3}).png({compressionLevel:9,adaptiveFiltering:false,palette:false}).toBuffer();
  await writeFile(path,image);
  derivatives.push({path,width,height,contentWidth,contentHeight:12,density,sha256:createHash('sha256').update(image).digest('hex'),source,sourceSha256});
 }
}
await writeFile('docs/content/map-art-derivatives.json',JSON.stringify({purpose:'Decorative navigation thumbnails, not additional cards or replacement full-size illustrations.',originalProvenance:'docs/content/card-art-provenance.json',generator:'scripts/generate-map-thumbnails.mjs',tool:'sharp@0.34.5',filter:'Lanczos3, centered cover, losslessPNG',semanticContent:'Live System titles, levels, routes and rules remain DOM text; full-size production CardFace is unchanged.',derivatives},null,2)+'\n');
console.log(`Generated ${derivatives.length} original-art derivatives from ${names.length} canonical System illustration.`);
