// Serve two real static builds on one origin, as Pages does in production.
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { requireEmulatorReadiness } from './emulator-readiness.mjs';
const clients = [['/beyond/pr2', 'build-e2e-preview'], ['/beyond', 'build-e2e-production']];
for (const [base, directory] of clients) execFileSync('bun', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, PUBLIC_BASE_PATH: base, BUILD_DIRECTORY: directory } });
// The existing web-server startup budget includes actual emulator readiness.
await requireEmulatorReadiness(process.env.PUBLIC_FIREBASE_PROJECT_ID,fetch,{auth:Number(process.env.PUBLIC_AUTH_EMULATOR_PORT||9297),firestore:Number(process.env.PUBLIC_FIRESTORE_EMULATOR_PORT||8197)});
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' };
createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const client = clients.find(([base]) => path === base || path.startsWith(`${base}/`));
  if (!client) { response.writeHead(404).end(); return; }
  const [base, directory] = client, root = resolve(directory);
  let file = resolve(root, `.${path.slice(base.length) || '/'}`);
  if (!file.startsWith(`${root}/`) && file !== root) { response.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, 'index.html');
  if (!existsSync(file)) file = resolve(root, '404.html');
  response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  response.end(readFileSync(file));
}).listen(4197, '127.0.0.1');
