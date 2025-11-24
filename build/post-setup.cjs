#!/usr/bin/env node
/**
 * Post-install setup tasks
 * Runs after all dependencies are installed
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

function log(message) {
  console.log(`[post-setup] ${message}`);
}

function error(message) {
  console.error(`[post-setup] ❌ ${message}`);
}

function runScript(scriptName, scriptPath) {
  log(`Running ${scriptName}...`);
  try {
    execSync(`sh -c 'mv ${scriptPath} ${scriptPath.replace('.js', '.cjs')} 2>/dev/null || true && node ${scriptPath.replace('.js', '.cjs')} && mv ${scriptPath.replace('.js', '.cjs')} ${scriptPath} 2>/dev/null || true'`, {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    log(`✓ ${scriptName} complete`);
    return true;
  } catch (err) {
    error(`${scriptName} failed: ${err.message}`);
    return false;
  }
}

function createProxyConfig() {
  const template = path.join(ROOT_DIR, 'proxy.conf.template.js');
  const target = path.join(ROOT_DIR, 'proxy.conf.js');

  if (!fs.existsSync(target) && fs.existsSync(template)) {
    try {
      fs.copyFileSync(template, target);
      log('✓ Created proxy.conf.js from template');
    } catch (err) {
      error(`Failed to create proxy config: ${err.message}`);
    }
  }
}

function checkExtensionModule() {
  const extensionModule = path.join(ROOT_DIR, 'src/frontend/packages/core/src/features/extensions/_custom-import.module.ts');

  if (!fs.existsSync(extensionModule)) {
    log('⚠️  Extension module not found');
    log('   This is expected on first install and will be generated during build');
  } else {
    log('✓ Extension module exists');
  }
}

function checkDevkitBuild() {
  const distDevkit = path.join(ROOT_DIR, 'dist-devkit');

  if (fs.existsSync(distDevkit)) {
    log('✓ Devkit built successfully');
  } else {
    error('Devkit was not built properly');
    log('   Try: rm -rf dist-devkit && bun install');
  }
}

function buildCustomBuilders() {
  const buildersDir = path.join(ROOT_DIR, 'tools/builders/prebuild-application');
  const distDir = path.join(buildersDir, 'dist');

  // Check if already built
  if (fs.existsSync(distDir)) {
    log('✓ Custom builders already built');
    return;
  }

  if (!fs.existsSync(buildersDir)) {
    log('⚠️  Custom builders directory not found');
    return;
  }

  log('Building custom Angular builders...');
  try {
    execSync('npm run build', {
      cwd: buildersDir,
      stdio: 'inherit'
    });
    log('✓ Custom builders compiled successfully');
  } catch (err) {
    error(`Failed to build custom builders: ${err.message}`);
    log('   The build may fail. Try running: cd tools/builders/prebuild-application && npm run build');
  }
}

function main() {
  log('Running post-install setup tasks...');
  log('');

  // Check devkit
  checkDevkitBuild();

  // Build custom builders
  buildCustomBuilders();

  // Run dev-setup
  const devSetupPath = path.join(ROOT_DIR, 'build/dev-setup.js');
  if (fs.existsSync(devSetupPath)) {
    runScript('dev-setup', devSetupPath);
  }

  // Run clean-symlinks
  const cleanSymlinksPath = path.join(ROOT_DIR, 'build/clean-symlinks.js');
  if (fs.existsSync(cleanSymlinksPath)) {
    runScript('clean-symlinks', cleanSymlinksPath);
  }

  // Run store-git-metadata
  const storeMetadataPath = path.join(ROOT_DIR, 'build/store-git-metadata.js');
  if (fs.existsSync(storeMetadataPath)) {
    runScript('store-git-metadata', storeMetadataPath);
  }

  // Run prepare-backend
  const prepareBackendPath = path.join(ROOT_DIR, 'dist-devkit/backend.js');
  if (fs.existsSync(prepareBackendPath)) {
    runScript('prepare-backend', prepareBackendPath);
  } else {
    log('⚠️  Backend preparation script not found (will run during build)');
  }

  // Create proxy config if needed
  createProxyConfig();

  // Check extension module
  checkExtensionModule();

  log('');
  log('✅ Post-install setup complete!');
  log('');
  log('Next steps:');
  log('  Development: bun run start');
  log('  Production:  bun run build');
  log('  Testing:     bun test');
}

if (require.main === module) {
  main();
}
