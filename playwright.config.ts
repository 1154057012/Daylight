import { defineConfig } from '@playwright/test';

const onlineBaseUrl = process.env.DAYLIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  globalTeardown: onlineBaseUrl ? undefined : './scripts/stop-test-server.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: onlineBaseUrl || 'http://127.0.0.1:5178/Daylight/',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 1050 },
    trace: 'retain-on-failure',
  },
  webServer: onlineBaseUrl ? undefined : {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://127.0.0.1:5178/Daylight/',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
