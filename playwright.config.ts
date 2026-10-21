import { defineConfig } from '@playwright/test';
import {browserSharedMemory} from './scripts/browser-shared-memory.mjs';
const base = '/beyond/pr2';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  updateSnapshots: 'none',
  // Complete illustrated rounds have independent operation/capture deadlines.
  // Linux traces need >60s for 58+ native frames; no operation inherits this allowance.
  timeout: 120_000,
  reporter: [['list'], ['html', { open: 'never' }], ['./tests/e2e/helpers/story-reporter.ts']],
  snapshotPathTemplate: '{testDir}/{testFileDir}/screenshots/{arg}{ext}',
  use: {
    baseURL: `http://127.0.0.1:4197${base}/`,
    actionTimeout: 2_000,
    navigationTimeout: 2_000,
    trace: { mode: 'retain-on-failure', screenshots: false, snapshots: false, sources: true },
    screenshot: 'off',
    deviceScaleFactor: 1,
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    launchOptions: { ...browserSharedMemory(), args: ['--disable-gpu', '--disable-partial-raster', '--use-gl=swiftshader', '--run-all-compositor-stages-before-draw', '--disable-checker-imaging', '--font-render-hinting=none', '--disable-font-subpixel-positioning', '--disable-lcd-text', '--force-device-scale-factor=1', '--num-raster-threads=2', '--disable-skia-runtime-opts'] }
  },
  expect: { timeout: 2_000, toHaveScreenshot: { timeout: 2_000, maxDiffPixels: 0, threshold: 0 } },
  projects: [
    { name: 'phone', testMatch: ['**/arrival.spec.ts', '**/gallery.spec.ts', '**/remote.spec.ts', '**/modes.spec.ts', '**/setup-remote.spec.ts', '**/research-remote.spec.ts', '**/discovery-remote.spec.ts', '**/rival-remote.spec.ts', '**/production-remote.spec.ts', '**/trading-remote.spec.ts', '**/automation-remote.spec.ts', '**/fleet-remote.spec.ts', '**/jump-remote.spec.ts'], use: { viewport: { width: 393, height: 852 } } },
    { name: 'desktop-compact', testMatch: '**/gallery.spec.ts', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'tabletop-4k', testIgnore: ['**/remote.spec.ts','**/setup-remote.spec.ts','**/setup-shared-compact.spec.ts','**/research-remote.spec.ts','**/research-shared-compact.spec.ts','**/research-remote-compact.spec.ts','**/discovery-remote.spec.ts', '**/rival-remote.spec.ts', '**/production-remote.spec.ts', '**/trading-remote.spec.ts', '**/automation-remote.spec.ts', '**/fleet-remote.spec.ts', '**/jump-remote.spec.ts'], use: { viewport: { width: 3840, height: 2160 } } }
  ],
  webServer: {
    command: 'node scripts/serve-e2e.mjs',
    url: `http://127.0.0.1:4197${base}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PUBLIC_BASE_PATH: base,
      PUBLIC_FIREBASE_EMULATORS: 'true',
      PUBLIC_FIREBASE_API_KEY: 'demo-key',
      PUBLIC_FIREBASE_PROJECT_ID: 'demo-beyond',
      PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-beyond.firebaseapp.com',
      PUBLIC_FIREBASE_APP_ID: 'demo-beyond'
    }
  }
});
