import https from 'https';
import fs from 'fs';
import path from 'path';

// Port configuration (matches playwright.config.ts defaults)
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '5543');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '5540');

// Matches SQLITE_DB_DIR / SQLiteDatabaseFile in the jetstream webServer
// command in playwright.config.ts.
const BACKEND_DB_FILE = path.join(process.cwd(), 'dist/e2e-db/console-database.db');

/**
 * Playwright global setup — report test environment status.
 * Servers are auto-started by webServer config if not already running.
 * Test processes are identifiable via: ps aux | grep 'STRATOS_E2E=e2e'
 *
 * NOTE: Playwright starts webServer processes (per reuseExistingServer)
 * before running this file, so checkPort() below always observes an
 * already-listening backend — it cannot by itself tell fresh boot from
 * reused. See backendBootStatus() for the actual fresh-vs-reused signal.
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

/**
 * Fresh-vs-reused backend detection.
 *
 * The jetstream webServer command runs with SQLITE_KEEP_DB=false, so a
 * REAL boot always deletes-and-recreates BACKEND_DB_FILE (see jetstream's
 * datastore.NewGooseDBConf). If reuseExistingServer:true finds the port
 * already listening, Playwright never spawns a new jetstream process at
 * all this run, so the DB file's mtime is left over from whichever earlier
 * invocation last booted it — i.e. older than this run's start time.
 *
 * Preferred alternative (tapping the jetstream "SQLite Database file:" log
 * line directly) isn't reachable here: Playwright only pipes webServer
 * stdout to the terminal when `stdout: 'pipe'` is set, and even then that
 * output isn't exposed to globalSetup — it's written directly to the CLI
 * process's own stdout. DB file mtime vs run-start is the documented
 * fallback for exactly this case and needs no extra plumbing.
 */
function backendBootStatus(): 'fresh boot' | 'reused (existing process)' | 'unknown (no run-start anchor)' | 'unknown (no db file found)' {
  const runStart = Number(process.env.E2E_RUN_START);
  try {
    const mtimeMs = fs.statSync(BACKEND_DB_FILE).mtimeMs;
    // The DB file is present — it's the E2E_RUN_START anchor that's
    // missing, not the file. Distinct from the catch-block case below.
    if (!runStart) return 'unknown (no run-start anchor)';
    // Small negative skew allowance for filesystem timestamp resolution.
    return mtimeMs >= runStart - 2000 ? 'fresh boot' : 'reused (existing process)';
  } catch {
    return 'unknown (no db file found)';
  }
}

async function globalSetup() {
  const backendUp = await checkPort(BACKEND_PORT);
  const frontendUp = await checkPort(FRONTEND_PORT);
  const bootStatus = backendBootStatus();

  console.log('');
  console.log('  Test environment:');
  console.log(`    Backend  (port ${BACKEND_PORT}): ${backendUp ? 'reusing existing' : 'will be started'}`);
  console.log(`    Frontend (port ${FRONTEND_PORT}): ${frontendUp ? 'reusing existing' : 'will be started'}`);
  console.log('');
  console.log(`  BACKEND BOOT MARKER: ${bootStatus.toUpperCase()} (${BACKEND_DB_FILE})`);
  console.log('  (heuristic: mtime vs run-start — a reused backend that happens to write');
  console.log('   to the DB between config eval and this check can misreport as fresh boot)');
  console.log('');
}

export default globalSetup;
