#!/usr/bin/env node
/**
 * Cross-platform script to build custom Angular builders
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const BUILDERS_DIR = path.join(ROOT_DIR, 'tools', 'builders', 'prebuild-application');
const TARGET_DIR = path.join(ROOT_DIR, 'node_modules', '@stratos', 'builders');
const DIST_DIR = path.join(BUILDERS_DIR, 'dist');

console.log('Building custom Angular builders...');

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('bun install', {
    cwd: BUILDERS_DIR,
    stdio: 'inherit'
  });

  // Build
  console.log('Building...');
  execSync('bun run build', {
    cwd: BUILDERS_DIR,
    stdio: 'inherit'
  });

  // Create target directory
  console.log('Copying to node_modules...');
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // Copy dist directory
  if (fs.existsSync(DIST_DIR)) {
    const targetDist = path.join(TARGET_DIR, 'dist');
    if (fs.existsSync(targetDist)) {
      fs.rmSync(targetDist, { recursive: true, force: true });
    }
    fs.cpSync(DIST_DIR, targetDist, { recursive: true });
    console.log('✓ Builders built successfully');
  } else {
    console.error('❌ Build succeeded but dist directory not found');
    process.exit(1);
  }

} catch (err) {
  console.error('❌ Failed to build builders:', err.message);
  process.exit(1);
}
