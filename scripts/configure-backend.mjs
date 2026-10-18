import { writeFileSync } from 'node:fs';
const config = JSON.parse(process.env.FIREBASE_WEB_CONFIG ?? '{}');
for (const key of ['apiKey', 'projectId', 'authDomain', 'appId']) if (!config[key]) throw new Error(`Missing Firebase client setting: ${key}`);
const names = { apiKey: 'API_KEY', projectId: 'PROJECT_ID', authDomain: 'AUTH_DOMAIN', appId: 'APP_ID' };
writeFileSync('.env.production.local', Object.entries(names).map(([key, name]) => `PUBLIC_FIREBASE_${name}=${config[key]}`).join('\n') + '\nPUBLIC_FIREBASE_EMULATORS=false\n');
console.log(`Configured hosted Firebase project ${config.projectId}; emulator mode disabled.`);
