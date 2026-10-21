import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {  assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import {startingSetup} from '../../src/lib/game/setup';
import {economy} from '../../src/lib/game/turn';
import { apply, projectTable, clockwise, type TableEvent, type Table } from '../../src/lib/table';
let environment: RulesTestEnvironment;
beforeAll(async () => { environment = await initializeBackendTestEnvironment({ projectId: 'demo-beyond', firestore: { host: '127.0.0.1', port: Number(process.env.RULES_TEST_PORT??8197), rules: readFileSync('firestore.rules', 'utf8') } }); });
afterAll(async () => { await environment?.cleanup(); });
const event = (revision: number, type: TableEvent['type'], position: TableEvent['position'] = '', name = ''): TableEvent => ({ schema: 1, actorUid: 'controller', commandId: crypto.randomUUID(), revision, type, position, name });
function header(table: Table, commandId: string) { return { ...table, ownerUid: 'controller', schema: 1, mode: 'tabletop', lastCommand: commandId }; }
async function append(id: string, e: TableEvent, before?: Table) {
  const db = environment.authenticatedContext('controller').firestore(), next = apply(before, e), batch = writeBatch(db);
  batch.set(doc(db, `games/${id}`), header(next, e.commandId));
  batch.set(doc(db, `games/${id}/events/${e.commandId}`), e);
  await assertSucceeds(batch.commit()); return next;
}
describe('canonical table commands', () => {
  test('replays physical seats, clockwise first player, rename and leave; rejects malformed histories', () => {
    const events = [event(0, 'table-created'), event(1, 'seat-joined', 'south', 'Ada'), event(2, 'seat-joined', 'north', 'Bora'), event(3, 'seat-joined', 'east', 'Cleo'), event(4, 'first-player-chosen', 'north')];
    let table = projectTable(events);
    expect(clockwise(table)).toEqual(['north', 'east', 'south']);
    table = apply(table, event(5, 'seat-renamed', 'south', 'Ada Lovelace'));
    table = apply(table, event(6, 'seat-left', 'north'));
    expect(table.firstPlayer).toBe('east');
    expect(table.seats.south).toBe('Ada Lovelace');
    expect(() => projectTable([...events, event(7, 'seat-left', 'south')])).toThrow();
    expect(() => apply(table, event(7, 'seat-joined', 'south', 'Other'))).toThrow();
    expect(() => apply(table, event(7, 'seat-renamed', 'south', ' '))).toThrow();
  });
  test('requires atomic immutable attributed commands and forbids cross-controller access', async () => {
    const id = crypto.randomUUID(), db = environment.authenticatedContext('controller').firestore();
    const initial = event(0, 'table-created');
    let table = await append(id, initial);
    table = await append(id, event(1, 'seat-joined', 'south', 'Ada'), table);
    expect((await assertSucceeds(getDoc(doc(db, `games/${id}`)))).data()?.seats.south).toBe('Ada');
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), `games/${id}`)));
    await assertFails(getDoc(doc(environment.authenticatedContext('other').firestore(), `games/${id}/events/${initial.commandId}`)));
    await assertFails(updateDoc(doc(db, `games/${id}`), { ownerUid: 'other' }));
    await assertFails(deleteDoc(doc(db, `games/${id}/events/${initial.commandId}`)));
    await assertFails(updateDoc(doc(db, `games/${id}/events/${initial.commandId}`), { name: 'forged' }));
    await assertFails(updateDoc(doc(db, `games/${id}`), { seats: { north: 'forged' }, revision: 2 }));
    await assertFails(setDoc(doc(db, `games/${id}/events/orphan`), event(2, 'seat-joined', 'north', 'Bora')));
    await assertFails(setDoc(doc(db, 'channels/pr2/games/new'), header(table, 'bad')));
    await assertFails(setDoc(doc(db, 'secrets/anything'), { open: true }));
  });
  test('rejects capacity violations, invalid names and forged projections; accepts seat release and first-player changes', async () => {
    const id = crypto.randomUUID(), db = environment.authenticatedContext('controller').firestore();
    let table = await append(id, event(0, 'table-created'));
    for (const [position, name] of [['south','Ada'],['north','Bora'],['east','Cleo'],['west','Dara']] as const) table = await append(id, event(table.revision + 1, 'seat-joined', position, name), table);
    for (const command of [event(5, 'seat-joined', 'south-east', 'Fifth'), event(5, 'seat-joined', 'south', 'Taken'), event(5, 'seat-renamed', 'south', ' '), event(5, 'first-player-chosen', 'north-east')]) {
      const batch = writeBatch(db);
      batch.set(doc(db, `games/${id}`), { ...header(table, command.commandId), revision: 5 });
      batch.set(doc(db, `games/${id}/events/${command.commandId}`), command);
      await assertFails(batch.commit());
    }
    // A valid-looking event cannot change a second seat or invent its projected consequence.
    const forged = event(5, 'seat-renamed', 'south', 'Ada Lovelace'), batch = writeBatch(db);
    batch.set(doc(db, `games/${id}`), { ...header(table, forged.commandId), revision: 5, seats: { ...table.seats, south: 'Ada Lovelace', north: 'Hacked' } });
    batch.set(doc(db, `games/${id}/events/${forged.commandId}`), forged);
    await assertFails(batch.commit());
    table = await append(id, event(5, 'first-player-chosen', 'north'), table);
    table = await append(id, event(6, 'seat-left', 'north'), table);
    expect(table.firstPlayer).toBe('east');
    table = await append(id, event(7, 'seat-joined', 'north-east', 'Eli'), table);
    expect(Object.keys(table.seats)).toHaveLength(4);
  });
  test('one successor wins a revision race and duplicate command identity does not append twice', async () => {
    const id = crypto.randomUUID(), db = environment.authenticatedContext('controller').firestore();
    await append(id, event(0, 'table-created'));
    const submit = async (e: TableEvent) => runTransaction(db, async transaction => {
      const root = doc(db, `games/${id}`), eventRef = doc(db, `games/${id}/events/${e.commandId}`);
      const [snapshot, existing] = await Promise.all([transaction.get(root), transaction.get(eventRef)]);
      if (existing.exists()) return 'duplicate';
      const next = apply(snapshot.data() as Table, e);
      transaction.set(root, header(next, e.commandId)); transaction.set(eventRef, e); return 'accepted';
    });
    const a = event(1, 'seat-joined', 'south', 'Ada'), b = event(1, 'seat-joined', 'south', 'Bora');
    const results = await Promise.allSettled([submit(a), submit(b)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const winner = results[0].status === 'fulfilled' ? a : b;
    expect(await submit(winner)).toBe('duplicate');
    expect((await getDoc(doc(db, `games/${id}`))).data()?.revision).toBe(1);
  });
});

for(const count of [2,3,4] as const)test(`first-turn ${count}-player shared split jump preserves untouched rivals through outpost control`,async()=>{
 const id=crypto.randomUUID();let table=await append(id,event(0,'table-created'));
 const seats=[['south','Ada','nishida'],['north','Bora','zheng'],['east','Cleo','united-nations'],['west','Dara','disciples']] as const;
 for(const [position,name] of seats.slice(0,count))table=await append(id,event(table.revision+1,'seat-joined',position,name),table);
 for(const [position,,faction] of seats.slice(0,count))table=await append(id,{...event(table.revision+1,'table-faction-selected',position),faction},table);
 table=await append(id,{...event(table.revision+1,'game-begun'),start:{version:'basic-2020-v1',seed:'11111111-1111-4111-8111-000000000007'}},table);
 const command=async(move:NonNullable<TableEvent['move']>)=>{table=await append(id,{...event(table.revision+1,'game-move','south'),move},table);};
 await command({kind:'prepare-discovery'});for(const [position] of seats.slice(0,count))await command({kind:'prepare-fleet-power',position});
 await command({kind:'build-jump',space:0,build:true,destination:'sol'});await command({kind:'discovery-advance',at:table.play!.discovery!.cursor});
 await command({kind:'discovery-choice',at:table.play!.discovery!.cursor,option:'jump',legs:table.play!.players.south.ships.map((ship,index)=>({ship:ship.id,index,path:['sol','a-1']}))});
 for(let i=0;i<10&&table.play!.discovery!.queue[0].kind!=='control-check';i++)await command({kind:'discovery-advance',at:table.play!.discovery!.cursor});
 expect(table.play!.discovery!.queue[0].kind).toBe('control-check');
 const move={...event(table.revision+1,'game-move','south'),move:{kind:'discovery-advance' as const,at:table.play!.discovery!.cursor}},forged=apply(table,move);
 // The exact observed regression is forbidden: even unchanged initial rival
 // economies cannot be materialized by another player's continuation.
 const initial=startingSetup(table.start!,clockwise(table).map(position=>({position,name:table.seats[position]!,faction:table.factions![position]!})),{factions:'basic',achievements:'introductory'});
 forged.play!.players.north=economy(initial.players.find(p=>p.position==='north')!);
 const db=environment.authenticatedContext('controller').firestore(),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),header(forged,move.commandId));batch.set(doc(db,`games/${id}/events/${move.commandId}`),move);await assertFails(batch.commit());
 table=await append(id,move,table);expect(Object.keys(table.play!.players)).toEqual(['south']);expect(table.play!.discovery!.queue[0]).toMatchObject({kind:'control',responder:'south',location:'a-1'});
});

for(const indices of [[0,1],[0,2],[1,2]])test(`Zheng opening Barnard jump ${indices.join('+')} preserves its third ship and resolves the printed population bonus`,async()=>{
 const id=crypto.randomUUID();let table=await append(id,event(0,'table-created'));
 for(const [position,name] of [['south','Ada'],['north','Bora']] as const)table=await append(id,event(table.revision+1,'seat-joined',position,name),table);
 for(const [position,faction] of [['south','zheng'],['north','united-nations']] as const)table=await append(id,{...event(table.revision+1,'table-faction-selected',position),faction},table);
 // Captured from a separate ordinary-UI setup whose public starting A card is
 // Barnard's Star; no reviewer room, identity or concealed information is used.
 const start={version:'basic-2020-v1' as const,seed:'96761feb-0c82-42f7-892a-17504aef86db'};
 table=await append(id,{...event(table.revision+1,'game-begun'),start},table);
 const initial=startingSetup(start,[{position:'south',name:'Ada',faction:'zheng'},{position:'north',name:'Bora',faction:'united-nations'}],{factions:'basic',achievements:'introductory'});
 expect(initial.systems.find(s=>s.slot==='a-1')!.card).toBe('barnards-star');
 const command=async(move:NonNullable<TableEvent['move']>)=>{table=await append(id,{...event(table.revision+1,'game-move','south'),move},table);};
 await command({kind:'prepare-discovery'});for(const position of ['south','north'])await command({kind:'prepare-fleet-power',position});
 await command({kind:'build-jump',space:0,build:true,destination:'sol'});await command({kind:'discovery-advance',at:table.play!.discovery!.cursor});
 expect(table.play!.players.south.ships).toHaveLength(3);
 await command({kind:'discovery-choice',at:table.play!.discovery!.cursor,option:'jump',legs:indices.map(index=>({ship:table.play!.players.south.ships[index].id,index,path:['sol','a-1']}))});
 for(let i=0;i<20&&table.play!.phase==='discovery';i++)await command({kind:'discovery-advance',at:table.play!.discovery!.cursor});
 expect(table.play!.phase).toBe('production');expect(table.play!.discovery!.queue).toEqual([]);expect(table.play!.discovery!.powers.south).toMatchObject({sol:1,'a-1':2,'*':3});expect(table.play!.discovery!.outposts['a-1']).toEqual({owner:'south',track:'food'});
 expect(table.play!.players.south).toMatchObject({population:2,ore:1,supply:[3,4,3,3,2],foodDiscs:7});expect(table.play!.players.south.ships.map(s=>s.location)).toEqual([0,1,2].map(i=>indices.includes(i)?'a-1':'sol'));expect(Object.keys(table.play!.players)).toEqual(['south']);
 const saved=await getDoc(doc(environment.authenticatedContext('controller').firestore(),`games/${id}`));expect(saved.data()!.play).toEqual(table.play);
});
