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
  log('Building custom Angular builders...');
  const buildersDir = path.join(ROOT_DIR, 'tools/builders/prebuild-application');
  const buildersNodeModules = path.join(ROOT_DIR, 'node_modules/@stratos/builders');
  const buildersDist = path.join(buildersNodeModules, 'dist');

  // Check if already built
  if (fs.existsSync(buildersDist) && fs.readdirSync(buildersDist).length > 0) {
    log('✓ Custom builders already built');
    return true;
  }

  try {
    // Install dependencies
    log('  Installing builder dependencies...');
    execSync('bun install', {
      cwd: buildersDir,
      stdio: 'inherit'
    });

    // Build TypeScript
    log('  Compiling TypeScript...');
    execSync('bun run build', {
      cwd: buildersDir,
      stdio: 'inherit'
    });

    // Copy dist to node_modules
    const distSrc = path.join(buildersDir, 'dist');
    if (fs.existsSync(distSrc)) {
      fs.cpSync(distSrc, buildersDist, { recursive: true });
      log('✓ Custom builders built successfully');
      return true;
    } else {
      error('Build succeeded but dist directory not found');
      return false;
    }
  } catch (err) {
    error(`Failed to build custom builders: ${err.message}`);
    return false;
  }
}

function generateExtensionModule() {
  log('Generating extension module...');
  const extensionGenPath = path.join(ROOT_DIR, 'build/extension-generator.mjs');
  const extensionModulePath = path.join(ROOT_DIR, 'src/frontend/packages/core/src/_custom-import.module.ts');

  // Check if already exists
  if (fs.existsSync(extensionModulePath)) {
    log('✓ Extension module already exists');
    return true;
  }

  if (!fs.existsSync(extensionGenPath)) {
    log('⚠️  Extension generator not found, will be generated during build');
    return false;
  }

  return runScript('extension-generator', extensionGenPath);
}

function applySkipWorktreeFlags() {
  log('Applying skip-worktree flags to build-modified files...');
  const filesToSkip = [
    'src/frontend/packages/core/src/index.html'
  ];

  let appliedCount = 0;
  for (const file of filesToSkip) {
    const filePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      try {
        execSync(`git update-index --skip-worktree "${file}"`, {
          cwd: ROOT_DIR,
          stdio: 'pipe'
        });
        appliedCount++;
      } catch (err) {
        // Silently ignore errors (file may not be tracked or already has flag)
      }
    }
  }

  if (appliedCount > 0) {
    log(`✓ Applied skip-worktree flags to ${appliedCount} file(s)`);
  }
}

function main() {
  log('Running post-install setup tasks...');
  log('');

  // Check devkit
  checkDevkitBuild();

  // Build custom Angular builders
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

  // Generate extension module
  generateExtensionModule();

  // Run prepare-backend
  const prepareBackendPath = path.join(ROOT_DIR, 'dist-devkit/backend.js');
  if (fs.existsSync(prepareBackendPath)) {
    runScript('prepare-backend', prepareBackendPath);
  } else {
    log('⚠️  Backend preparation script not found (will run during build)');
  }

  // Create proxy config if needed
  createProxyConfig();

  // Apply skip-worktree flags to build-modified files
  applySkipWorktreeFlags();

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
