import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFirestoreEmulator, collection, doc, getDocsFromServer, getFirestore, orderBy, query, runTransaction } from 'firebase/firestore';
import { env } from '$env/dynamic/public';
import { apply, projectTable, type Command, type Table, type TableEvent } from './table';
let session: ReturnType<typeof connect> | undefined;
function connect() {
  const app = initializeApp({ apiKey: env.PUBLIC_FIREBASE_API_KEY || 'demo-key', authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-beyond.firebaseapp.com', projectId: env.PUBLIC_FIREBASE_PROJECT_ID || 'demo-beyond', appId: env.PUBLIC_FIREBASE_APP_ID || 'demo-beyond' });
  const auth = getAuth(app), db = getFirestore(app);
  if (env.PUBLIC_FIREBASE_EMULATORS === 'true') { connectAuthEmulator(auth, 'http://127.0.0.1:9297', { disableWarnings: true }); connectFirestoreEmulator(db, '127.0.0.1', 8197); }
  const ready = auth.authStateReady().then(async () => auth.currentUser ?? (await signInAnonymously(auth)).user);
  return { auth, db, ready };
}
export function backend() { return session ??= connect(); }
export const retainedKey = 'beyond-table-v1';
export async function commitTable(id: string, command: Command, expectedRevision: number, commandId: string): Promise<Table> {
  const { db, ready } = backend(), user = await ready;
  const root = doc(db, `games/${id}`), eventRef = doc(collection(root, 'events'), commandId);
  return runTransaction(db, async transaction => {
    const [existing, duplicate] = await Promise.all([transaction.get(root), transaction.get(eventRef)]);
    if (duplicate.exists()) {
      const previous = duplicate.data() as TableEvent;
      if (previous.type !== command.type || previous.position !== command.position || previous.name !== command.name) throw new Error('Command identity was already used.');
      return existing.data() as Table;
    }
    const before = existing.exists() ? existing.data() as Table : undefined;
    if ((before?.revision ?? -1) !== expectedRevision) throw new Error('The table changed in another tab. Reopen it before trying again.');
    const event: TableEvent = { ...command, schema: 1, actorUid: user.uid, revision: expectedRevision + 1, commandId };
    const table = apply(before, event);
    transaction.set(eventRef, event);
    transaction.set(root, { ...table, ownerUid: user.uid, schema: 1, mode: 'tabletop', lastCommand: commandId });
    return table;
  });
}
export async function restoreTable(id: string) {
  const { db, ready } = backend(); await ready;
  const events = await getDocsFromServer(query(collection(db, `games/${id}/events`), orderBy('revision')));
  return projectTable(events.docs.map(event => event.data() as TableEvent));
}
