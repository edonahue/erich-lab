import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:4321',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm --prefix .. run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
});
