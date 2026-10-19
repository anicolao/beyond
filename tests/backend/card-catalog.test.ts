import checklist from '../../docs/content/second-printing-card-inventory.json';
import {describe,test,expect} from 'bun:test';
import {baseCards,canonicalCard,inventoryCounts,physicalCardCount,originalArtGaps} from '../../src/lib/cards/catalog';
import {auditCardInventory,expectedBaseIds} from '../../src/lib/cards/inventory-audit';

describe('second-printing base physical inventory',()=>{
 test('canonical production faces exactly equal the independent setup identities and publisher quantities',()=>{
  expect(baseCards).toHaveLength(100);expect(new Set(expectedBaseIds).size).toBe(100);expect(auditCardInventory(baseCards)).toEqual([]);expect(physicalCardCount).toBe(100);
  expect(inventoryCounts).toEqual([{family:'Technology',designs:46,copies:46},{family:'Event',designs:20,copies:20},{family:'System',designs:24,copies:24},{family:'Achievement',designs:10,copies:10}]);
  for(const card of baseCards)expect(canonicalCard(card.id)).toBe(card);
 });
 test('every face agrees with the separately pinned source checklist, including physical quantities and type directions',()=>{
  const normalize=(s:string)=>s.replaceAll('’',"'");
  expect(checklist.cards).toHaveLength(100);
  for(const row of checklist.cards){const card=canonicalCard(row.id);expect(row.family).toBe(card.family);expect(card.copies).toBe(row.copies);expect(normalize(card.event?.fixed?`${card.title}, ${card.subtitle}`:card.title)).toBe(normalize(row.printedTitle));
   if('level'in row)expect(row.level).toBe(card.badge);
   if('incoming'in row){expect(JSON.stringify(card.technology?.incoming)).toBe(JSON.stringify(row.incoming));expect(JSON.stringify(card.technology?.outgoing)).toBe(JSON.stringify(row.outgoing));}
   if('fixed'in row)expect(card.event?.fixed).toBe(row.fixed);
   if('deck'in row)expect(row.deck).toBe(card.deck);
   if('points'in row)expect(row.points).toBe(card.points);
   if('power'in row)expect(card.sections.find(s=>s.label==='Colonize')?.cost).toBe(`${row.power} military power`);
   if('rewards'in row)expect(card.rewards).toEqual(row.rewards);
   if('specialties'in row){const text=card.sections.find(s=>s.label==='Specialty')!.text;expect(text.includes('Food')).toBe(row.specialties!.includes('Food'));expect(text.includes('Ore')).toBe(row.specialties!.includes('Ore'));}
  }
 });
 test('missing, extra, duplicate and wrong-copy manifests are rejected independently',()=>{
  expect(auditCardInventory(baseCards.slice(1))).toContain('Missing ID: terraforming');
  expect(auditCardInventory([...baseCards,{...baseCards[0],id:'invented-filler'}])).toContain('Extra ID: invented-filler');
  expect(auditCardInventory([...baseCards,baseCards[0]])).toContain('Duplicate ID: terraforming');
  expect(auditCardInventory(baseCards.map((c,i)=>i===0?{...c,copies:2}:c))).toContain('Wrong physical quantity: terraforming');
 });
 test('base faces exclude balance replacements, promos and invented fixture cards',()=>{
  for(const id of ['beta-colony','sagittarius-a','modular-fleet-revised','stealth-terraformers-revised','orbital-laboratories','autonomous-foundries'])expect(()=>canonicalCard(id)).toThrow();
  expect(canonicalCard('modular-fleet').sections.map(s=>s.text).join(' ')).not.toContain('Jump up to 2');
  expect(canonicalCard('technological-singularity').sections.map(s=>s.text).join(' ')).toContain('maximum 8 VP');
 });
 test('source audit corrections remain explicit, with complete original art and no guessed face text',()=>{
  expect(canonicalCard('den-0255-4700').sections.at(-1)?.text).toContain('Level II technology');
  expect(canonicalCard('ez-aquarii').sections.at(-1)?.text).toContain('already discovered');
  expect(canonicalCard('luytens-star').sections.find(s=>s.label==='Entry restriction')?.text).toContain('at least 2 Level III');
  expect(canonicalCard('specialization').sections[0].text).toContain('shipyards');
  expect(canonicalCard('experimental-prototypes').sections[0].text).toContain('Roll your leftmost Supply cube');
  expect(originalArtGaps).toEqual([]);
 });
});
