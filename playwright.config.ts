import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    ...devices['Desktop Chrome'],
    channel: 'msedge',
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'node tests/serve-api.cjs', port: 3002, reuseExistingServer: false },
    {
      command: 'npm run dev -- --port 5174',
      port: 5174,
      env: { VITE_API_URL: 'http://127.0.0.1:3002' },
      reuseExistingServer: false,
    },
  ],
})
