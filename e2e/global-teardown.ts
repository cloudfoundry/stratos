import { execSync } from 'child_process';

const BACKEND_PORT = process.env.BACKEND_PORT || '5543';

/**
 * Playwright global teardown — kill test servers by session ID.
 *
 * The backend port serves as the session ID. Both backend and frontend
 * processes include 'e2e:<port>' in their command line via STRATOS_E2E env var:
 *   - Backend:  STRATOS_E2E=e2e:5543 ... jetstream
 *   - Frontend: STRATOS_E2E=e2e:5543 ... bun run ng serve ...
 *
 * A single pkill pattern matches both.
 */
async function globalTeardown() {
  const pattern = `e2e:${BACKEND_PORT}`;
  try {
    const pids = execSync(`pgrep -f '${pattern}'`, { encoding: 'utf8' }).trim();
    if (pids) {
      execSync(`pkill -f '${pattern}'`);
      console.log(`  Stopped e2e test servers (session ${BACKEND_PORT}).`);
    }
  } catch {
    // No matching processes — nothing to clean up
  }
}

export default globalTeardown;
