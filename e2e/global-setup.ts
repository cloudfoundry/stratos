import https from 'https';

// Port configuration (matches playwright.config.ts defaults)
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '5543');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '5540');

/**
 * Playwright global setup — report test environment status.
 * Servers are auto-started by webServer config if not already running.
 * Test processes are identifiable via: ps aux | grep 'STRATOS_E2E=e2e'
 */
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.get(
      { hostname: 'localhost', port, path: '/', rejectUnauthorized: false, timeout: 3000 },
      () => resolve(true)
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function globalSetup() {
  const backendUp = await checkPort(BACKEND_PORT);
  const frontendUp = await checkPort(FRONTEND_PORT);

  console.log('');
  console.log('  Test environment:');
  console.log(`    Backend  (port ${BACKEND_PORT}): ${backendUp ? 'reusing existing' : 'will be started'}`);
  console.log(`    Frontend (port ${FRONTEND_PORT}): ${frontendUp ? 'reusing existing' : 'will be started'}`);
  console.log('');
}

export default globalSetup;
