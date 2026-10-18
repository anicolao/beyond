// One-time, owner-run conversion of the superseded PR2 scaffold. Dry run by default.
// Keeps IDs/controller UIDs and original legacy records; all active clients use games/<id>.
const { getGlobalDefaultAccount, getAccessToken } = require('firebase-tools/lib/auth.js');
const project = 'beyond-20261018';
(async () => {
  const account = getGlobalDefaultAccount();
  const token = await getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  const root = `projects/${project}/databases/(default)/documents`, url = `https://firestore.googleapis.com/v1/${root}`;
  const headers = { Authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' };
  async function read(path) {
    const response = await fetch(`${url}/${path}`, { headers });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Read failed: ${response.status}`);
    return response.json();
  }
  function value(data) {
    if (typeof data === 'string') return { stringValue: data };
    if (typeof data === 'number') return { integerValue: String(data) };
    return { mapValue: { fields: Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)])) } };
  }
  const inventory = await read('channels/pr2/games?pageSize=1000');
  if (inventory?.nextPageToken) throw new Error('Paginate the migration inventory before continuing.');
  let converted = 0, existing = 0;
  for (const original of inventory?.documents ?? []) {
    const id = original.name.split('/').at(-1);
    if (await read(`games/${id}`)) { existing++; continue; }
    const old = await read(`channels/pr2/games/${id}/events/000000`);
    if (old?.fields.type.stringValue !== 'table-created' || old.fields.seats.arrayValue.values.length !== 2) throw new Error('Unknown legacy history; refusing to infer a migration.');
    const ownerUid = original.fields.ownerUid.stringValue;
    const seats = old.fields.seats.arrayValue.values.map(item => Object.fromEntries(Object.entries(item.mapValue.fields).map(([key, item]) => [key, item.stringValue])));
    if (seats[0].position !== 'south' || seats[1].position !== 'north' || seats.some(seat => !seat.name.trim())) throw new Error('Malformed legacy seats.');
    const events = [{ type: 'table-created', position: '', name: '' }, ...seats.map(seat => ({ type: 'seat-joined', ...seat }))].map((command, revision) => ({ ...command, schema: 1, actorUid: ownerUid, revision, commandId: `legacy-conversion-${revision}` }));
    const table = { ownerUid, schema: 1, mode: 'tabletop', revision: 2, lastCommand: events[2].commandId, firstPlayer: 'south', seats: Object.fromEntries(seats.map(seat => [seat.position, seat.name])) };
    const documents = [[`games/${id}`, table], ...events.map(e => [`games/${id}/events/${e.commandId}`, e])];
    if (process.argv.includes('--apply')) {
      const writes = documents.map(([path, data]) => ({ update: { name: `${root}/${path}`, fields: value(data).mapValue.fields }, currentDocument: { exists: false } }));
      const response = await fetch(`${url}:commit`, { method: 'POST', headers, body: JSON.stringify({ writes }) });
      if (!response.ok) throw new Error(`Atomic conversion failed: ${response.status}`);
      const actual = await read(`games/${id}`);
      if (actual.fields.ownerUid.stringValue !== ownerUid || actual.fields.revision.integerValue !== '2') throw new Error('Conversion verification failed.');
    }
    converted++;
  }
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'applied' : 'dry-run', converted, alreadyCanonical: existing }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
