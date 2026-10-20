/** Infrastructure startup, before the browser journey's operation clock begins.
 * No credentials, identities, gameplay writes, retries or timed UI waits. */
export async function requireEmulatorReadiness(projectId, request = fetch, ports = {auth:9297,firestore:8197}) {
  if (!/^demo-[a-z0-9-]+$/.test(projectId ?? '')) throw new Error('E2E readiness requires an isolated demo project.');
  if (![ports.auth,ports.firestore].every(port=>Number.isInteger(port)&&port>1023&&port<=65535)) throw new Error('Invalid local emulator port.');
  const project = encodeURIComponent(projectId);
  async function probe(url, service) {
    try { return await request(url, { signal: AbortSignal.timeout(10_000) }); }
    catch (error) { throw new Error(`${service} emulator readiness request failed within its existing10s startup limit.`, { cause: error }); }
  }
  const [auth, database] = await Promise.all([
    probe(`http://127.0.0.1:${ports.auth}/emulator/v1/projects/${project}/config`, 'Auth'),
    // A denial proves this project's database and authenticated-get rules can
    // answer, rather than merely that the emulator TCP port is listening.
    probe(`http://127.0.0.1:${ports.firestore}/v1/projects/${project}/databases/(default)/documents/invites/_connection`, 'Firestore')
  ]);
  if (auth.status !== 200) throw new Error(`Auth emulator is not ready (${auth.status}).`);
  await auth.json();
  const result = await database.json();
  if (database.status !== 403 || result.error?.status !== 'PERMISSION_DENIED') throw new Error(`Firestore emulator or authenticated-get rules are not ready (${database.status}).`);
}
