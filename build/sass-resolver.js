#!/usr/bin/env node
/**
 * sass-resolver.js
 *
 * SASS Tilde Import Resolver for Angular 20 Migration
 *
 * Purpose: Resolves tilde (~) prefixed SCSS imports to actual file paths.
 * The webpack sass-loader provided custom import resolution via sassOptions.importer,
 * but Angular 20's esbuild-based build system doesn't support this directly.
 *
 * Strategy: Preprocess SCSS files to resolve tilde imports before Angular CLI processes them.
 * This is safer than trying to integrate with esbuild's plugin system during migration.
 *
 * Usage:
 *   node sass-resolver.js --analyze    # Analyze SCSS files for tilde imports
 *   node sass-resolver.js --resolve    # Resolve imports (creates backup first)
 *   node sass-resolver.js --restore    # Restore from backups
 *
 * Patterns resolved:
 *   ~@stratosui/theme/styles/main  → ../../packages/theme/styles/main
 *   ~@stratosui/theme/helper       → ../../packages/theme/helper
 *   ~@stratosui/theme              → ../../packages/theme/_index
 *
 * Reference: dist-devkit/build/sass.js (original webpack implementation)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  // Use current working directory as project root, or allow override via environment
  projectRoot: process.env.PROJECT_ROOT || process.cwd(),
  packagesDir: 'src/frontend/packages',
  themePackage: 'theme',
  backupSuffix: '.sass-resolver-backup',

  // Known package mappings (from config.resolveKnownPackage)
  knownPackages: {
    '@stratosui/theme': 'src/frontend/packages/theme',
    '@stratosui/core': 'src/frontend/packages/core',
    '@stratosui/store': 'src/frontend/packages/store',
    '@stratosui/cloud-foundry': 'src/frontend/packages/cloud-foundry',
    '@stratosui/kubernetes': 'src/frontend/packages/kubernetes',
  }
};

/**
 * Calculate relative path from source file to target package path
 * @param {string} sourceFile - Absolute path to SCSS file being processed
 * @param {string} targetPackagePath - Absolute path to target package
 * @param {string} importPath - Remaining import path after package name
 * @returns {string} - Relative path for import
 */
function calculateRelativePath(sourceFile, targetPackagePath, importPath) {
  const sourceDir = path.dirname(sourceFile);
  let targetPath = targetPackagePath;

  if (importPath) {
    targetPath = path.join(targetPackagePath, importPath);
  }

  // Calculate relative path
  let relativePath = path.relative(sourceDir, targetPath);

  // Ensure forward slashes for SCSS imports
  relativePath = relativePath.replace(/\\/g, '/');

  // Ensure path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  return relativePath;
}

/**
 * Resolve a tilde import to a relative path
 * @param {string} importStatement - Full import line from SCSS
 * @param {string} sourceFile - Absolute path to source file
 * @returns {object} - { resolved: boolean, newImport: string, reason: string }
 */
function resolveTildeImport(importStatement, sourceFile) {
  // Extract the import URL from @use, @import, or @forward statements
  // Handle both single and double quotes
  const importMatch = importStatement.match(/@(use|import|forward)\s+['"]([^'"]+)['"]/);

  if (!importMatch) {
    return { resolved: false, reason: 'Not an import statement' };
  }

  const importType = importMatch[1];
  const importUrl = importMatch[2];

  // Only process tilde imports
  if (!importUrl.startsWith('~')) {
    return { resolved: false, reason: 'Not a tilde import' };
  }

  // Remove leading tilde
  const packagePath = importUrl.substring(1);

  // Special case: ~@stratosui/theme/extensions (generates dynamic content)
  if (packagePath === '@stratosui/theme/extensions') {
    return {
      resolved: false,
      reason: 'Special dynamic import - requires Angular build system handling'
    };
  }

  // Parse package name and import path
  const parts = packagePath.split('/');
  let packageName = '';
  let remainingPath = '';

  if (parts[0].startsWith('@')) {
    // Scoped package: @stratosui/theme
    packageName = `${parts[0]}/${parts[1]}`;
    remainingPath = parts.slice(2).join('/');
  } else {
    // Unscoped package
    packageName = parts[0];
    remainingPath = parts.slice(1).join('/');
  }

  // Look up known package
  const knownPackagePath = CONFIG.knownPackages[packageName];

  if (!knownPackagePath) {
    return {
      resolved: false,
      reason: `Unknown package: ${packageName}`
    };
  }

  const absolutePackagePath = path.join(CONFIG.projectRoot, knownPackagePath);

  // Special handling for ~@stratosui/theme without path
  if (packageName === '@stratosui/theme' && !remainingPath) {
    // Should resolve to theme package's _index.scss
    remainingPath = '_index';
  }

  // Calculate relative path
  const relativePath = calculateRelativePath(
    sourceFile,
    absolutePackagePath,
    remainingPath
  );

  // Reconstruct the import statement
  const newImport = importStatement.replace(
    /(['"])~[^'"]+(['"])/,
    `$1${relativePath}$2`
  );

  return {
    resolved: true,
    newImport,
    originalPackage: packageName,
    originalPath: importUrl,
    resolvedPath: relativePath
  };
}

/**
 * Process a single SCSS file to resolve tilde imports
 * @param {string} filePath - Absolute path to SCSS file
 * @param {boolean} dryRun - If true, only analyze without modifying
 * @returns {object} - Processing results
 */
function processScssFile(filePath, dryRun = false) {
  const results = {
    file: path.relative(CONFIG.projectRoot, filePath),
    modified: false,
    imports: [],
    errors: []
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check if line contains tilde import
      if (line.includes('~')) {
        const resolution = resolveTildeImport(line, filePath);

        if (resolution.resolved) {
          results.imports.push({
            line: lineNum,
            original: line.trim(),
            resolved: resolution.newImport.trim(),
            package: resolution.originalPackage,
            path: resolution.resolvedPath
          });

          newLines.push(resolution.newImport);
          modified = true;
        } else if (resolution.reason === 'Special dynamic import - requires Angular build system handling') {
          // Keep dynamic imports as-is
          results.imports.push({
            line: lineNum,
            original: line.trim(),
            resolved: line.trim(),
            package: 'special',
            reason: resolution.reason
          });
          newLines.push(line);
        } else {
          // Not resolved - keep original
          newLines.push(line);

          // Only log as error if it looks like an import but couldn't be resolved
          if (line.match(/[@](use|import|forward)\s+['"]~/) && resolution.reason !== 'Not an import statement') {
            results.errors.push({
              line: lineNum,
              content: line.trim(),
              reason: resolution.reason
            });
          }
        }
      } else {
        newLines.push(line);
      }
    }

    if (modified && !dryRun) {
      // Create backup
      const backupPath = filePath + CONFIG.backupSuffix;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content, 'utf8');
      }

      // Write resolved version
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      results.modified = true;
    }

    results.modified = modified;

  } catch (error) {
    results.errors.push({
      line: 0,
      content: 'File processing error',
      reason: error.message
    });
  }

  return results;
}

/**
 * Recursively find all SCSS files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} fileList - Accumulated file list
 * @returns {string[]} - Array of absolute file paths
 */
function findScssFilesRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules, dist, and backup files
    if (file === 'node_modules' || file === 'dist' || file.endsWith('.sass-resolver-backup')) {
      continue;
    }

    if (stat.isDirectory()) {
      findScssFilesRecursive(filePath, fileList);
    } else if (file.endsWith('.scss') || file.endsWith('.scss.template')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Find all SCSS files in the project
 * @returns {Promise<string[]>} - Array of absolute file paths
 */
async function findScssFiles() {
  const packagesPath = path.join(CONFIG.projectRoot, CONFIG.packagesDir);
  return findScssFilesRecursive(packagesPath);
}

/**
 * Analyze all SCSS files for tilde imports
 */
async function analyzeScssFiles() {
  console.log('🔍 Analyzing SCSS files for tilde imports...\n');

  const files = await findScssFiles();
  console.log(`Found ${files.length} SCSS files\n`);

  const summary = {
    totalFiles: files.length,
    filesWithTildeImports: 0,
    totalImports: 0,
    resolvedImports: 0,
    unresolvedImports: 0,
    specialImports: 0,
    errors: 0
  };

  const detailedResults = [];

  for (const file of files) {
    const result = processScssFile(file, true);

    if (result.imports.length > 0 || result.errors.length > 0) {
      summary.filesWithTildeImports++;
      summary.totalImports += result.imports.length;

      result.imports.forEach(imp => {
        if (imp.package === 'special') {
          summary.specialImports++;
        } else if (imp.resolved !== imp.original) {
          summary.resolvedImports++;
        }
      });

      summary.unresolvedImports += result.errors.length;
      summary.errors += result.errors.length;

      detailedResults.push(result);
    }
  }

  // Print summary
  console.log('📊 Analysis Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total SCSS files:              ${summary.totalFiles}`);
  console.log(`Files with tilde imports:      ${summary.filesWithTildeImports}`);
  console.log(`Total tilde imports found:     ${summary.totalImports}`);
  console.log(`Resolvable imports:            ${summary.resolvedImports}`);
  console.log(`Special/dynamic imports:       ${summary.specialImports}`);
  console.log(`Unresolved imports:            ${summary.unresolvedImports}`);
  console.log(`Errors:                        ${summary.errors}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Print detailed results
  if (detailedResults.length > 0) {
    console.log('📋 Detailed Results:\n');

    detailedResults.forEach(result => {
      if (result.imports.length > 0) {
        console.log(`📄 ${result.file}`);

        result.imports.forEach(imp => {
          if (imp.package === 'special') {
            console.log(`  Line ${imp.line}: [SPECIAL] ${imp.original}`);
            console.log(`           → ${imp.reason}`);
          } else {
            console.log(`  Line ${imp.line}: ${imp.original}`);
            console.log(`           → ${imp.resolved}`);
          }
        });

        if (result.errors.length > 0) {
          result.errors.forEach(err => {
            console.log(`  ❌ Line ${err.line}: ${err.content}`);
            console.log(`     Reason: ${err.reason}`);
          });
        }

        console.log('');
      }
    });
  }

  return summary;
}

/**
 * Resolve tilde imports in all SCSS files
 */
async function resolveScssImports() {
  console.log('🔧 Resolving tilde imports in SCSS files...\n');

  const files = await findScssFiles();
  console.log(`Processing ${files.length} SCSS files\n`);

  let modifiedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const result = processScssFile(file, false);

    if (result.modified) {
      modifiedCount++;
      console.log(`✅ Modified: ${result.file}`);

      result.imports.forEach(imp => {
        if (imp.package !== 'special') {
          console.log(`   ${imp.original}`);
          console.log(`   → ${imp.resolved}`);
        }
      });
    }

    if (result.errors.length > 0) {
      errorCount++;
      console.log(`❌ Errors in: ${result.file}`);
      result.errors.forEach(err => {
        console.log(`   Line ${err.line}: ${err.reason}`);
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Modified ${modifiedCount} files`);
  console.log(`❌ Errors in ${errorCount} files`);
  console.log('═══════════════════════════════════════════════════\n');

  if (modifiedCount > 0) {
    console.log('💡 Backups created with .sass-resolver-backup extension');
    console.log('💡 Run with --restore to revert changes\n');
  }
}

/**
 * Find all backup files in the project
 * @returns {string[]} - Array of absolute backup file paths
 */
function findBackupFiles(dir, backupFiles = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules and dist
    if (file === 'node_modules' || file === 'dist') {
      continue;
    }

    if (stat.isDirectory()) {
      findBackupFiles(filePath, backupFiles);
    } else if (file.endsWith(CONFIG.backupSuffix)) {
      backupFiles.push(filePath);
    }
  }

  return backupFiles;
}

/**
 * Restore SCSS files from backups
 */
async function restoreScssFiles() {
  console.log('🔄 Restoring SCSS files from backups...\n');

  const packagesPath = path.join(CONFIG.projectRoot, CONFIG.packagesDir);
  const backupFiles = findBackupFiles(packagesPath);

  console.log(`Found ${backupFiles.length} backup files\n`);

  let restoredCount = 0;

  for (const backupFile of backupFiles) {
    const originalFile = backupFile.replace(CONFIG.backupSuffix, '');

    try {
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      fs.writeFileSync(originalFile, backupContent, 'utf8');
      fs.unlinkSync(backupFile);

      console.log(`✅ Restored: ${path.relative(CONFIG.projectRoot, originalFile)}`);
      restoredCount++;
    } catch (error) {
      console.log(`❌ Failed to restore: ${originalFile}`);
      console.log(`   ${error.message}`);
    }
  }

  console.log(`\n✅ Restored ${restoredCount} files\n`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  SASS Tilde Import Resolver                      ║');
  console.log('║  Angular 20 Migration - Phase 2                  ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    switch (command) {
      case '--analyze':
      case '-a':
        await analyzeScssFiles();
        break;

      case '--resolve':
      case '-r':
        await resolveScssImports();
        break;

      case '--restore':
        await restoreScssFiles();
        break;

      default:
        console.log('Usage:');
        console.log('  node sass-resolver.js --analyze    Analyze SCSS files');
        console.log('  node sass-resolver.js --resolve    Resolve imports');
        console.log('  node sass-resolver.js --restore    Restore from backups');
        console.log('');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly (ES module version)
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

// Export functions for testing
export {
  resolveTildeImport,
  calculateRelativePath,
  processScssFile,
  findScssFiles,
  analyzeScssFiles,
  resolveScssImports,
  restoreScssFiles,
  CONFIG
};
