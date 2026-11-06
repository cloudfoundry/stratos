#!/usr/bin/env node
/**
 * Version Check Script
 *
 * Validates that the correct versions of Node.js and Bun are installed
 * before running tests. This ensures test compatibility across different
 * development environments.
 *
 * Required versions (see .tool-versions for the exact pins):
 * - Node.js: 24.x or 26.x
 * - Bun: 1.3.14+ (vitest runs on the bun runtime via `bunx --bun`)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function error(msg) {
  console.error(`${RED}${BOLD}✗ ERROR:${RESET} ${RED}${msg}${RESET}`);
}

function warn(msg) {
  console.warn(`${YELLOW}${BOLD}⚠ WARNING:${RESET} ${YELLOW}${msg}${RESET}`);
}

function success(msg) {
  console.log(`${GREEN}${BOLD}✓${RESET} ${GREEN}${msg}${RESET}`);
}

function info(msg) {
  console.log(`${BOLD}ℹ${RESET} ${msg}`);
}

function checkNodeVersion() {
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));

  if (nodeMajor < 24) {
    error(`Node.js version ${nodeVersion} detected. Required: 24.x or higher`);
    info('Install Node.js 24+:');
    console.log('  • Using nvm: nvm install 24');
    console.log('  • Using asdf: asdf install nodejs 24.11.0');
    console.log('  • Download: https://nodejs.org/');
    return false;
  }

  success(`Node.js ${nodeVersion} ✓`);
  return true;
}

function checkBunVersion() {
  let bunVersion;

  try {
    bunVersion = execSync('bun --version', { encoding: 'utf8' }).trim();
  } catch (e) {
    error('Bun is not installed or not in PATH');
    info('Install Bun:');
    console.log('  • curl -fsSL https://bun.sh/install | bash');
    console.log('  • Or visit: https://bun.sh');
    return false;
  }

  // Parse version (e.g., "1.3.2" -> [1, 3, 2])
  const versionParts = bunVersion.split('.').map(v => parseInt(v));
  const [major, minor] = versionParts;

  // Require Bun 1.2.0 or higher
  if (major !== 1 || minor < 2) {
    error(`Bun version ${bunVersion} detected. Required: 1.2.0 or higher`);
    info('Install Bun:');
    console.log('  • bun upgrade');
    console.log('  • Or using asdf: asdf install bun latest');
    return false;
  }

  success(`Bun ${bunVersion} ✓`);
  return true;
}

function main() {
  console.log(`\n${BOLD}Checking development environment versions...${RESET}\n`);

  const nodeOk = checkNodeVersion();
  const bunOk = checkBunVersion();

  console.log('');

  if (!nodeOk || !bunOk) {
    error('Version check failed! Please install the correct versions before running tests.');
    console.log('\nSee .tool-versions file for exact version specifications.');
    process.exit(1);
  }

  success('All version checks passed!');
  console.log('');
}

// Only run if executed directly (not required as module)
if (require.main === module) {
  main();
}

module.exports = { checkNodeVersion, checkBunVersion };
