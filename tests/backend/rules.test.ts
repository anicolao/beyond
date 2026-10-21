import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {  assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
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
