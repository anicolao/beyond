import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Publish only this revision's source. Never convert an arbitrary PATCH failure
 * into release creation, and never print authenticated request exceptions. */
export async function deployFirestoreRules({ request, content, project = 'beyond-20261018', pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  const root = `projects/${project}`;
  const releaseName = `${root}/releases/cloud.firestore`;
  const files = [{ name: 'firestore.rules', content }];
  async function call(method, path, data, allowed = []) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try { response = await request({ method, path, data }); }
      catch (error) { response = { status: error.response?.status ?? 0 }; }
      if (response.status >= 200 && response.status < 300 || allowed.includes(response.status)) return response;
      if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 2) {
        await pause(1000 * (attempt + 1));
        continue;
      }
      throw new Error(`Rules ${method} ${path}: HTTP ${response.status}; publication blocked`);
    }
  }
  function rulesetName(name) {
    if (typeof name !== 'string' || !name.startsWith(`${root}/rulesets/`) || !/^[\w-]+$/.test(name.slice(`${root}/rulesets/`.length))) throw new Error('Invalid project ruleset identity');
    return name;
  }
  async function matches(name) {
    const { data } = await call('GET', rulesetName(name));
    const actual = data?.source?.files;
    return actual?.length === 1 && actual[0].name === files[0].name && actual[0].content === content;
  }
  const compiled = await call('POST', `${root}:test`, { source: { files } });
  if ((compiled.data?.issues ?? []).some(issue => issue.severity === 'ERROR')) throw new Error('Rules compilation rejected current source; publication blocked');
  const current = await call('GET', releaseName, undefined, [404]);
  if (current.status !== 404 && current.data?.name !== releaseName) throw new Error('Unexpected release identity');
  let desired = current.data?.rulesetName;
  if (!desired || !await matches(desired)) {
    const created = await call('POST', `${root}/rulesets`, { source: { files } });
    desired = rulesetName(created.data?.name);
    if (!await matches(desired)) throw new Error('Uploaded rules differ from current source; publication blocked');
    const release = { name: releaseName, rulesetName: desired };
    if (current.status === 404) {
      const result = await call('POST', `${root}/releases`, release, [409]);
      if (result.status === 409) {
        // A real concurrent creator may win after our explicit 404. Confirm the
        // existing identity before updating it; no delete or fallback rules.
        const raced = await call('GET', releaseName);
        if (raced.data?.name !== releaseName) throw new Error('Unexpected concurrent release identity');
        await call('PATCH', releaseName, { release, updateMask: 'rulesetName' });
      }
    } else {
      await call('PATCH', releaseName, { release, updateMask: 'rulesetName' });
    }
  }
  const verified = await call('GET', releaseName);
  if (verified.data?.name !== releaseName || verified.data?.rulesetName !== desired || !await matches(desired)) throw new Error('Release readback differs from current source; publication blocked');
  return { release: releaseName, ruleset: desired, verified: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const client = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient();
    const result = await deployFirestoreRules({ content: await readFile('firestore.rules', 'utf8'), request: ({ path, ...options }) => client.request({ url: `https://firebaserules.googleapis.com/v1/${path}`, ...options, timeout: 20000, retry: false }) });
    console.log(JSON.stringify(result));
  } catch (error) {
    // Our domain errors contain only method/path/status. Authentication/client
    // exceptions can contain credentials, so never serialize those exceptions.
    console.error(error.message?.startsWith('Rules ') || /^(Invalid project|Unexpected |Uploaded rules|Release readback)/.test(error.message ?? '') ? error.message : 'Rules deployment failed; publication blocked');
    process.exitCode = 1;
  }
}
