import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/infrastructure',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 10_000,
  reporter: 'list',
  use: { viewport: { width: 1000, height: 800 }, actionTimeout: 2_000, navigationTimeout: 2_000 },
  expect: { timeout: 2_000 }
});
