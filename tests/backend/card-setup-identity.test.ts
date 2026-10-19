import {test,expect} from 'bun:test';
import {canonicalCard} from '../../src/lib/cards/catalog';
import {technologyDecks,events,systemDecks,achievementDecks,levelOne} from '../../src/lib/game/manifest';
test('all level, type-direction, fixed-event and deck assignments match the independent setup manifest',()=>{
  for(const [level,ids]of Object.entries({I:levelOne,...technologyDecks}))for(const id of ids){const c=canonicalCard(id);expect(c.family).toBe('Technology');expect(String(c.technology?.level)).toBe(level);expect(c.badge).toBe(level);expect(c.technology?.incoming.length).toBe(level==='I'?0:level==='IIII'&&['giga-corporations','parallel-universe-generator','neo-industrial-revolution','mind-machine-assimilation','galactic-empire','android-independence'].includes(id)?2:1);if(level==='IIII')expect(c.technology?.outgoing).toEqual([]);else{expect(c.technology!.outgoing.length).toBeGreaterThanOrEqual(1);expect(c.technology!.outgoing.length).toBeLessThanOrEqual(2);}}
  for(const [level,groups]of Object.entries(events))for(const [kind,ids]of Object.entries(groups))for(const id of ids){expect(String(canonicalCard(id).event?.level)).toBe(level);expect(canonicalCard(id).event?.fixed).toBe(kind==='fixed');}
  for(const [deck,ids]of Object.entries(systemDecks))for(const id of ids)expect(String(canonicalCard(id).deck)).toBe(deck);
  for(const [deck,ids]of Object.entries(achievementDecks))for(const id of ids){expect(String(canonicalCard(id).deck)).toBe(deck);expect(canonicalCard(id).rewards).toEqual(deck==='A'?[3,2]:[3]);}
 });
