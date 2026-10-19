import {test,expect} from 'bun:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import provenance from '../../docs/content/card-art-provenance.json';
import {baseCards,canonicalCard,originalArtGaps} from '../../src/lib/cards/catalog';
import {originalCardArt} from '../../src/lib/cards/original-art';

test('all canonical faces have original art, with distinct native assets and recoverable provenance',()=>{
 expect(originalArtGaps).toEqual([]);
 expect(provenance.assets).toHaveLength(68);
 expect(new Set(provenance.assets.map(a=>a.id)).size).toBe(68);
 expect(Object.keys(originalCardArt).sort()).toEqual(provenance.assets.map(a=>a.id).sort());
 const hashes=new Set<string>();
 for(const asset of provenance.assets){
  const card=canonicalCard(asset.id);expect(asset.family).toBe(card.family);expect(card.title).toBe(asset.title);
  expect(card.art).toBe(`${asset.id}-v1`);expect(asset.status).toBe('generated');
  expect(asset.destination).toBe(`static/art/cards/${card.art}.png`);
  const bytes=readFileSync(asset.destination);const hash=createHash('sha256').update(bytes).digest('hex');
  expect(hash).toBe(asset.sha256);expect(hashes.has(hash)).toBe(false);hashes.add(hash);
  expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBeGreaterThanOrEqual(1024);expect(bytes.readUInt32BE(20)).toBeGreaterThanOrEqual(1024);
  if('artPosition' in asset)expect(card.artPosition).toBe(asset.artPosition);
  expect(asset.prompt).toContain(card.title);expect(asset.method).toBe('built-in image_gen');
  expect(asset.source).toContain('Original generated illustration');expect(asset.generationPath).toMatch(/\/exec-[\da-f-]+\.png$/);
 }
 for(const card of baseCards)if(card.art!=='astronomy')expect(()=>readFileSync(`static/art/cards/${card.art}.png`)).not.toThrow();
});
