import type { FactionId } from '$lib/game/manifest';
import type { BasicStart } from '$lib/game/setup';
import { doc, collection, getDocFromServer, getDocsFromServer, onSnapshot, orderBy, query, runTransaction } from 'firebase/firestore';
import { backend } from '$lib/backend';
import { applyRemote, projectRemote, sameSettings, type RemoteCommand, type RemoteEvent, type RemoteRoom, type RemoteSettings, type RemotePosition, remoteRetainedKey, lastGameKey } from './model';
export function retainRemote(id: string) { localStorage.setItem(remoteRetainedKey, id); localStorage.setItem(lastGameKey, JSON.stringify({ mode: 'remote', id })); }
export async function findRemote(code: string) {
  const { db, ready } = backend(); await ready;
  const invitation = await getDocFromServer(doc(db, 'invites', code.trim().toUpperCase()));
  if (!invitation.exists()) throw new Error('That code does not match a room. Check all five letters and try again.');
  return invitation.data().gameId as string;
}
export async function readRemote(id: string) {
  const { db, ready } = backend(); const user = await ready;
  const current = await getDocFromServer(doc(db, 'games', id));
  if (!current.exists()) throw new Error('This room could not be found. Check your invitation.');
  const room = current.data() as RemoteRoom;
  if (room.mode !== 'remote') throw new Error('Shared tables are joined at the physical display.');
  if (!['gathering','started'].includes(room.phase)) throw new Error('This game has already started. Use a client that supports its current phase.');
  if (room.members[user.uid]) {
    const history = await getDocsFromServer(query(collection(db, 'games', id, 'events'), orderBy('revision')));
    const replayed = projectRemote(history.docs.map(item => item.data() as RemoteEvent));
    if (replayed.revision < room.revision) throw new Error('Room history is still synchronizing. Retry to reconnect.');
    return replayed;
  }
  return room;
}
export function watchRemote(id: string, receive: (room: RemoteRoom) => void, fail: (message: string) => void) {
  return onSnapshot(doc(backend().db, 'games', id), { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
    if (!snapshot.exists()) { fail('This room could not be found.'); return; }
    const value = snapshot.data() as RemoteRoom;
    if (value.mode !== 'remote' || !['gathering','started'].includes(value.phase)) { fail('This game has already started or needs a newer client.'); return; }
    receive(value);
  }, () => fail('Connection interrupted. Your seat is retained. Retry to reconnect.'));
}
export async function createRemote(name: string, settings: RemoteSettings) {
  const { db, ready } = backend(), user = await ready;
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = crypto.randomUUID();
    const hex = id.replaceAll('-', '');
    const code = Array.from({ length: 5 }, (_, i) => String.fromCharCode(65 + parseInt(hex.slice(i * 2, i * 2 + 2), 16) % 26)).join('');
    const event: RemoteEvent = { schema: 1, actorUid: user.uid, revision: 0, commandId: crypto.randomUUID(), type: 'remote-created', position: 'p1', name: name.trim(), ready: false, settings, configVersion: 0, code };
    const next = applyRemote(undefined, event);
    const created = await runTransaction(db, async transaction => {
      const invite = doc(db, 'invites', code), root = doc(db, 'games', id);
      if ((await transaction.get(invite)).exists()) return false;
      transaction.set(root, next);
      transaction.set(doc(collection(root, 'events'), event.commandId), event);
      transaction.set(invite, { gameId: id, ownerUid: user.uid });
      return true;
    });
    if (created) { retainRemote(id); return { id, room: next }; }
  }
  throw new Error('We could not reserve an invitation code. Please try again.');
}
export type RemoteIntent = { type: RemoteCommand['type']; position?: RemotePosition; name?: string; ready?: boolean; settings?: RemoteSettings; faction?: FactionId; start?: BasicStart };
export async function sendRemote(id: string, intent: RemoteIntent, configVersion: number, commandId: string) {
  const { db, ready } = backend(), user = await ready;
  let next: RemoteRoom | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    let observedRevision = -1;
    try {
      next = await runTransaction(db, async transaction => {
    const root = doc(db, 'games', id), eventRef = doc(collection(root, 'events'), commandId);
    const [snapshot, duplicate] = await Promise.all([transaction.get(root), transaction.get(eventRef)]);
    if (!snapshot.exists() || snapshot.data().mode !== 'remote') throw new Error('This is not a remote room.');
    const before = snapshot.data() as RemoteRoom;
    observedRevision = before.revision;
    if (duplicate.exists()) {
      const prior = duplicate.data() as RemoteEvent;
      if (prior.actorUid !== user.uid || prior.type !== intent.type || prior.name !== (intent.name?.trim() ?? '') || prior.position !== (intent.position ?? '') || prior.ready !== (intent.ready ?? false) || (intent.settings && !sameSettings(prior.settings, intent.settings)) || prior.faction !== intent.faction || JSON.stringify(prior.start) !== JSON.stringify(intent.start)) throw new Error('Command identity was already used.');
      return before;
    }
    if (configVersion !== before.configVersion) throw new Error('Room setup changed. Review the current settings before continuing.');
    const changed = !['remote-ready-changed','remote-begun'].includes(intent.type);
    const event: RemoteEvent = { ...(intent.faction ? {faction:intent.faction}:{}), ...(intent.start ? {start:intent.start}:{}), schema: 1, actorUid: user.uid, revision: before.revision + 1, commandId, type: intent.type, position: intent.position ?? '', name: intent.name?.trim() ?? '', ready: intent.ready ?? false, settings: intent.settings ?? before.settings, code: before.code, configVersion: before.configVersion + Number(changed) };
    const after = applyRemote(before, event);
    transaction.set(root, after); transaction.set(eventRef, event);
    return after;
  });
    break;
    } catch (cause) {
      // The emulator can authorize against a newer root before reporting the
      // transaction precondition conflict. Retry only a proven revision race.
      if (attempt === 2 || (cause as { code?: string }).code !== 'permission-denied') throw cause;
      const current = await getDocFromServer(doc(db, 'games', id));
      if (!current.exists() || current.data().revision === observedRevision) throw cause;
    }
  }
  if (!next) throw new Error('Room changed while saving. Review the room and try again.');
  if (next.members[user.uid]) retainRemote(id);
  return next;
}
