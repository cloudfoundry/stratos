#!/usr/bin/env node
/**
 * Ensures devkit is built before bun workspace resolution
 * This eliminates the bootstrap requirement
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DEVKIT = path.join(ROOT_DIR, 'dist-devkit');
const DEVKIT_PKG = path.join(ROOT_DIR, 'src/frontend/packages/devkit');
const DEVKIT_PACKAGE_JSON = path.join(DEVKIT_PKG, 'package.json');

function log(message) {
  console.log(`[ensure-devkit] ${message}`);
}

function buildDevkit() {
  log('🔨 Building devkit (one-time setup)...');

  try {
    // Install devkit dependencies with npm (isolated from workspace)
    log('Installing devkit dependencies...');
    execSync('npm install --legacy-peer-deps', {
      cwd: DEVKIT_PKG,
      stdio: 'inherit',
      env: {...process.env, npm_config_workspace: ''}
    });

    // Build devkit
    log('Building devkit package...');
    execSync('npm run build', {
      cwd: DEVKIT_PKG,
      stdio: 'inherit'
    });

    log('✅ Devkit built successfully');
  } catch (error) {
    console.error('❌ Failed to build devkit:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Node.js 24+ is installed');
    console.error('2. Check internet connectivity');
    console.error('3. Try: rm -rf src/frontend/packages/devkit/node_modules && npm cache clean --force');
    process.exit(1);
  }
}

function main() {
  // Check if devkit package exists
  if (!fs.existsSync(DEVKIT_PACKAGE_JSON)) {
    log('❌ Devkit package not found at expected location');
    process.exit(1);
  }

  // Check if devkit is already built
  if (fs.existsSync(DIST_DEVKIT)) {
    const devkitStats = fs.statSync(DIST_DEVKIT);
    const packageStats = fs.statSync(DEVKIT_PACKAGE_JSON);

    // Rebuild if source is newer than build
    if (packageStats.mtime > devkitStats.mtime) {
      log('Devkit source updated, rebuilding...');
      buildDevkit();
    } else {
      log('✓ Devkit already built');
    }
  } else {
    // First time setup
    buildDevkit();
  }
}

if (require.main === module) {
  main();
}
