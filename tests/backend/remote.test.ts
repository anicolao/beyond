import { afterAll, beforeAll, expect, test } from 'bun:test';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { applyRemote, projectRemote, defaultSettings, type RemoteEvent, type RemoteRoom } from '../../src/lib/remote/model';
let env: RulesTestEnvironment;
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: 'demo-beyond', firestore: { host: '127.0.0.1', port: Number(process.env.RULES_TEST_PORT??8197), rules: readFileSync('firestore.rules', 'utf8') } }); });
afterAll(async () => { await env.cleanup(); });
const clients = new Map<string, ReturnType<RulesTestEnvironment['authenticatedContext']>>();
const db = (uid: string) => { if (!clients.has(uid)) clients.set(uid, env.authenticatedContext(uid)); return clients.get(uid)!.firestore(); };
function event(room?: RemoteRoom, extra: Partial<RemoteEvent> = {}): RemoteEvent {
  return { schema: 1, type: 'remote-created', actorUid: 'host', revision: room ? room.revision + 1 : 0, commandId: crypto.randomUUID(), position: 'p1', name: 'Ada', ready: false, code: room?.code ?? Array.from(crypto.getRandomValues(new Uint8Array(5)), v => String.fromCharCode(65 + v % 26)).join(''), settings: room?.settings ?? defaultSettings, configVersion: room ? room.configVersion + 1 : 0, ...extra };
}
async function write(id: string, e: RemoteEvent, after: RemoteRoom, creating = false, uid = e.actorUid) {
  const batch = writeBatch(db(uid));
  batch.set(doc(db(uid), `games/${id}`), after);
  batch.set(doc(db(uid), `games/${id}/events/${e.commandId}`), e);
  if (creating) batch.set(doc(db(uid), `invites/${e.code}`), { gameId: id, ownerUid: e.actorUid });
  return batch.commit();
}
async function room() {
  const id = crypto.randomUUID(), e = event(), initial = applyRemote(undefined, e);
  await assertSucceeds(write(id, e, initial, true));
  return { id, initial, e };
}
async function append(id: string, before: RemoteRoom, extra: Partial<RemoteEvent>) {
  const e = event(before, extra), after = applyRemote(before, e);
  await assertSucceeds(write(id, e, after)); return { after, e };
}
test('remote history replays readiness tied to setup; settings map order is irrelevant', () => {
  const created = event(), first = applyRemote(undefined, created);
  const join = event(first, { type: 'remote-seat-claimed', actorUid: 'guest', position: 'p2', name: 'Bora', settings: { achievements: 'introductory', factions: 'basic', capacity: 2 } });
  const joined = applyRemote(first, join);
  const ready = event(joined, { type: 'remote-ready-changed', actorUid: 'guest', position: 'p2', name: '', ready: true, configVersion: joined.configVersion });
  const prepared = applyRemote(joined, ready);
  expect(prepared.seats.p2?.ready).toBe(true);
  const rename = event(prepared, { type: 'remote-seat-renamed', actorUid: 'host', position: 'p1', name: 'Ada Lovelace' });
  expect(projectRemote([created, join, ready, rename]).seats.p2?.ready).toBe(false);
  expect(() => applyRemote(prepared, { ...rename, configVersion: 0 })).toThrow();
  expect(() => applyRemote(prepared, { ...rename, actorUid: 'guest' })).toThrow();
});
test('public invitation preview, member-only immutable history and no room enumeration', async () => {
  const { id, initial, e } = await room();
  expect((await assertSucceeds(getDoc(doc(db('visitor'), `invites/${initial.code}`)))).data()?.gameId).toBe(id);
  await assertSucceeds(getDoc(doc(db('visitor'), `games/${id}`)));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), `games/${id}`)));
  await assertFails(getDocs(collection(db('visitor'), 'games')));
  await assertFails(getDocs(collection(db('visitor'), 'invites')));
  await assertFails(getDocs(collection(db('visitor'), `games/${id}/events`)));
  await assertFails(getDoc(doc(db('visitor'), `games/${id}/events/${e.commandId}`)));
  await assertFails(updateDoc(doc(db('host'), `games/${id}/events/${e.commandId}`), { name: 'Forged' }));
  await assertFails(deleteDoc(doc(db('host'), `games/${id}/events/${e.commandId}`)));
  await assertFails(updateDoc(doc(db('host'), `invites/${initial.code}`), { gameId: 'hijack' }));
  await assertFails(deleteDoc(doc(db('host'), `invites/${initial.code}`)));
});
test('separate identities claim, confirm, rename and leave; only host changes setup', async () => {
  const { id, initial } = await room();
  let current = (await append(id, initial, { type: 'remote-seat-claimed', actorUid: 'guest', position: 'p2', name: 'Bora' })).after;
  await assertSucceeds(getDocs(collection(db('guest'), `games/${id}/events`)));
  current = (await append(id, current, { type: 'remote-ready-changed', actorUid: 'host', position: 'p1', name: '', ready: true, configVersion: current.configVersion })).after;
  current = (await append(id, current, { type: 'remote-ready-changed', actorUid: 'guest', position: 'p2', name: '', ready: true, configVersion: current.configVersion })).after;
  const setup = event(current, { type: 'remote-settings-changed', position: '', name: '', settings: { ...current.settings, factions: 'advanced' } });
  const changed = applyRemote(current, setup);
  await assertFails(write(id, { ...setup, actorUid: 'guest' }, changed));
  await assertSucceeds(write(id, setup, changed)); current = changed;
  expect(Object.values(current.seats).every(s => !s?.ready)).toBe(true);
  current = (await append(id, current, { type: 'remote-seat-renamed', actorUid: 'guest', position: 'p2', name: 'Bora Longname' })).after;
  current = (await append(id, current, { type: 'remote-seat-left', actorUid: 'guest', position: 'p2', name: '' })).after;
  expect(current.members.guest).toBeUndefined();
  await assertFails(getDocs(collection(db('guest'), `games/${id}/events`)));
});
test('rejects forged authority, stale setup, capacity and unlinked projection changes', async () => {
  const { id, initial } = await room();
  const e = event(initial, { type: 'remote-seat-claimed', actorUid: 'guest', position: 'p2', name: 'Bora' }), after = applyRemote(initial, e);
  await assertFails(write(id, e, after, false, 'intruder'));
  await assertFails(updateDoc(doc(db('host'), `games/${id}`), { revision: 1, seats: after.seats, members: after.members }));
  for (const altered of [
    { ...after, configVersion: 0 },
    { ...after, ownerUid: 'guest' },
    { ...after, seats: { ...after.seats, p1: { uid: 'host', name: 'Forged', ready: false } } },
    { ...after, seats: { ...after.seats, p3: { uid: 'third', name: 'Third', ready: false } }, members: { ...after.members, third: 'p3' } },
    { ...after, seats: { ...after.seats, p2: { uid: 'guest', name: 'Bora', ready: true } } }
  ] as RemoteRoom[]) await assertFails(write(id, e, altered));
  await assertSucceeds(write(id, e, after));
  const ready = event(after, { type: 'remote-ready-changed', actorUid: 'guest', position: 'p2', name: '', ready: true, configVersion: after.configVersion });
  await assertFails(write(id, { ...ready, actorUid: 'host' }, applyRemote(after, ready)));
  await assertFails(write(id, { ...ready, configVersion: 0 }, applyRemote(after, ready)));
});
test('atomic competing seat claims produce exactly one occupant and immutable winning event', async () => {
  const { id, initial } = await room();
  const a = event(initial, { type: 'remote-seat-claimed', actorUid: 'guest-a', position: 'p2', name: 'Bora' });
  const b = { ...a, actorUid: 'guest-b', commandId: crypto.randomUUID(), name: 'Cleo' };
  const results = await Promise.allSettled([write(id, a, applyRemote(initial, a)), write(id, b, applyRemote(initial, b))]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  const final = (await getDoc(doc(db('host'), `games/${id}`))).data() as RemoteRoom;
  expect(Object.keys(final.seats)).toHaveLength(2); expect(final.revision).toBe(1);
  const winner = final.seats.p2?.uid === a.actorUid ? a : b;
  await assertFails(write(id, winner, final));
  expect((await getDocs(collection(db('host'), `games/${id}/events`))).size).toBe(2);
});
test('occupied seats survive capacity changes; identities cannot take a second seat or cross tabletop authority', async () => {
  const { id, initial } = await room();
  let current = (await append(id, initial, { type: 'remote-settings-changed', position: '', name: '', settings: { ...initial.settings, capacity: 4 } })).after;
  current = (await append(id, current, { type: 'remote-seat-claimed', actorUid: 'guest', position: 'p4', name: 'Bora' })).after;
  expect(() => applyRemote(current, event(current, { type: 'remote-settings-changed', position: '', name: '', settings: defaultSettings }))).toThrow();
  expect(() => applyRemote(current, event(current, { type: 'remote-seat-claimed', actorUid: 'guest', position: 'p2', name: 'Duplicate' }))).toThrow();
  const shrink = event(current, { type: 'remote-settings-changed', position: '', name: '', settings: defaultSettings });
  await assertFails(write(id, shrink, { ...current, revision: shrink.revision, lastCommand: shrink.commandId, configVersion: shrink.configVersion, settings: defaultSettings }));
  const oldId = crypto.randomUUID(), commandId = crypto.randomUUID(), batch = writeBatch(db('table-controller'));
  batch.set(doc(db('table-controller'), `games/${oldId}`), { schema: 1, mode: 'tabletop', ownerUid: 'table-controller', revision: 0, lastCommand: commandId, seats: {}, firstPlayer: '' });
  batch.set(doc(db('table-controller'), `games/${oldId}/events/${commandId}`), { schema: 1, type: 'table-created', actorUid: 'table-controller', revision: 0, commandId, position: '', name: '' });
  await assertSucceeds(batch.commit());
  await assertFails(getDoc(doc(db('guest'), `games/${oldId}`)));
  const takeover = event(undefined, { actorUid: 'table-controller' }), forged = applyRemote(undefined, takeover);
  await assertFails(write(oldId, takeover, forged, true));
  const physical = writeBatch(db('host')), physicalCommand = crypto.randomUUID();
  physical.set(doc(db('host'), `games/${id}`), { schema: 1, mode: 'tabletop', ownerUid: 'host', revision: current.revision + 1, lastCommand: physicalCommand, seats: { south: 'Ada' }, firstPlayer: 'south' });
  physical.set(doc(db('host'), `games/${id}/events/${physicalCommand}`), { schema: 1, type: 'seat-joined', actorUid: 'host', revision: current.revision + 1, commandId: physicalCommand, position: 'south', name: 'Ada' });
  await assertFails(physical.commit());
});
