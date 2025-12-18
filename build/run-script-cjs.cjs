#!/usr/bin/env node
/**
 * Cross-platform script runner for .js files that need to run as .cjs
 * Usage: node build/run-script-cjs.js <path-to-script>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptPath = process.argv[2];

if (!scriptPath) {
  console.error('Error: No script path provided');
  console.error('Usage: node build/run-script-cjs.js <path-to-script>');
  process.exit(1);
}

const absolutePath = path.resolve(scriptPath);
const cjsPath = absolutePath.replace(/\.js$/, '.cjs');
let renamed = false;

try {
  // Rename .js to .cjs if needed
  if (fs.existsSync(absolutePath) && absolutePath !== cjsPath) {
    try {
      fs.renameSync(absolutePath, cjsPath);
      renamed = true;
    } catch (e) {
      // If rename fails, try to use the file as-is
      console.warn(`Warning: Could not rename ${absolutePath} to ${cjsPath}`);
    }
  }
  
  // Run the script
  const targetScript = renamed || fs.existsSync(cjsPath) ? cjsPath : absolutePath;
  execSync(`node "${targetScript}"`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
} catch (err) {
  // Rename back before exiting with error
  if (renamed && fs.existsSync(cjsPath)) {
    try {
      fs.renameSync(cjsPath, absolutePath);
    } catch (e) {
      // Ignore
    }
  }
  process.exit(err.status || 1);
} finally {
  // Rename back to .js
  if (renamed && fs.existsSync(cjsPath)) {
    try {
      fs.renameSync(cjsPath, absolutePath);
    } catch (e) {
      console.warn(`Warning: Could not rename ${cjsPath} back to ${absolutePath}`);
    }
  }
}
