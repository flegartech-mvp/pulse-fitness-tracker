const disposableFirebaseEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-project',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo.appspot.com',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
};

module.exports = {
  testDir: './tests/smoke',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: './output/playwright/test-results',
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:19006',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run web -- --port 19006',
    url: 'http://localhost:19006',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      ...disposableFirebaseEnv,
      CI: '1',
    },
  },
};
