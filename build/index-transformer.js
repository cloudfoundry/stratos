#!/usr/bin/env node
/**
 * index-transformer.js
 * Transforms index.html to inject git metadata and theme loading assets
 *
 * Replaces webpack's index.transform.js for Angular 20 compatibility
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read git metadata from .stratos-git-metadata.json
 */
function readGitMetadata(rootDir) {
  const metadataPath = path.join(rootDir, '.stratos-git-metadata.json');

  if (fs.existsSync(metadataPath)) {
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Failed to read git metadata:', e.message);
    }
  }

  // Default metadata if file doesn't exist
  return {
    project: 'stratos',
    branch: 'dev',
    commit: 'unknown'
  };
}

/**
 * Read stratos.yaml configuration
 */
function readStratosConfig(rootDir) {
  const stratosYamlPath = process.env.STRATOS_YAML || path.join(rootDir, 'stratos.yaml');

  if (fs.existsSync(stratosYamlPath)) {
    try {
      return yaml.load(fs.readFileSync(stratosYamlPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Failed to read stratos.yaml:', e.message);
    }
  }

  return {};
}

/**
 * Find the theme package with loading assets
 */
function findThemeLoadingAssets(rootDir) {
  const packagesDir = path.join(rootDir, 'src/frontend/packages');

  // Default theme packages to check in order
  const themePackages = [
    'theme',
    'desktop-extensions',
    'example-theme'
  ];

  for (const themeName of themePackages) {
    const themeDir = path.join(packagesDir, themeName);
    const packageJsonPath = path.join(themeDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (packageJson.stratos && packageJson.stratos.theme) {
          const theme = packageJson.stratos.theme;
          const loadingCss = theme.loadingCss ? path.join(themeDir, theme.loadingCss) : null;
          const loadingHtml = theme.loadingHtml ? path.join(themeDir, theme.loadingHtml) : null;

          return {
            name: themeName,
            css: loadingCss && fs.existsSync(loadingCss) ? fs.readFileSync(loadingCss, 'utf8') : null,
            html: loadingHtml && fs.existsSync(loadingHtml) ? fs.readFileSync(loadingHtml, 'utf8') : null
          };
        }
      } catch (e) {
        console.warn(`⚠️ Failed to read theme package ${themeName}:`, e.message);
      }
    }
  }

  return { name: 'default', css: null, html: null };
}

/**
 * Transform index.html with all metadata and assets
 */
function transformIndexHtml(indexHtml, options = {}) {
  const rootDir = options.rootDir || process.cwd();

  // Read git metadata
  const gitMetadata = readGitMetadata(rootDir);

  // Read stratos configuration
  const stratosConfig = readStratosConfig(rootDir);
  const title = stratosConfig.title || 'Stratos';

  // Find theme loading assets
  const theme = findThemeLoadingAssets(rootDir);

  let transformed = indexHtml;

  // 1. Replace title
  transformed = transformed.replace(/@@TITLE@@/g, title);

  // 2. Replace git metadata in meta tags
  transformed = transformed.replace(/@@stratos_git_project@@/g, gitMetadata.project || 'stratos');
  transformed = transformed.replace(/@@stratos_git_branch@@/g, gitMetadata.branch || 'unknown');
  transformed = transformed.replace(/@@stratos_git_commit@@/g, gitMetadata.commit || 'unknown');

  // 3. Replace build date
  const buildDate = new Date().toString();
  transformed = transformed.replace(/@@stratos_build_date@@/g, buildDate);

  // 4. Replace loading CSS if theme provides it
  if (theme.css) {
    transformed = transformed.replace(/\/\*\* @@LOADING_CSS@@ \*\*\//g, theme.css);
  } else {
    // Remove placeholder if no CSS
    transformed = transformed.replace(/\/\*\* @@LOADING_CSS@@ \*\*\//g, '');
  }

  // 5. Replace loading HTML if theme provides it
  if (theme.html) {
    transformed = transformed.replace(/<!-- @@LOADING_HTML@@ -->/g, theme.html);
  } else {
    // Remove placeholder if no HTML
    transformed = transformed.replace(/<!-- @@LOADING_HTML@@ -->/g, '');
  }

  return transformed;
}

/**
 * Angular 20 indexHtmlTransformer API
 * This is the function that Angular builder will call
 */
async function angularIndexTransformer(indexHtml, options) {
  const rootDir = options?.projectRoot || process.cwd();
  return transformIndexHtml(indexHtml, { rootDir });
}

/**
 * Standalone mode for pre-build or testing
 */
function transformFile(inputPath, outputPath, rootDir) {
  console.log('📝 Transforming index.html...');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Root: ${rootDir}`);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const indexHtml = fs.readFileSync(inputPath, 'utf8');
  const transformed = transformIndexHtml(indexHtml, { rootDir });

  fs.writeFileSync(outputPath, transformed, 'utf8');
  console.log('✅ index.html transformed successfully');
}

// CLI mode when run directly (ES module version)
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node index-transformer.js [options] <input> [output]

Options:
  --root <path>   Root directory of the project (default: current directory)
  --help, -h      Show this help message

Arguments:
  input           Path to input index.html file
  output          Path to output file (default: same as input)

Examples:
  # Transform in place
  node index-transformer.js src/frontend/packages/core/src/index.html

  # Transform to different file
  node index-transformer.js src/index.html dist/index.html

  # Specify root directory
  node index-transformer.js --root /path/to/stratos src/index.html
`);
    process.exit(0);
  }

  let rootDir = process.cwd();
  let inputPath = null;
  let outputPath = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && i + 1 < args.length) {
      rootDir = path.resolve(args[i + 1]);
      i++;
    } else if (!inputPath) {
      inputPath = args[i];
    } else if (!outputPath) {
      outputPath = args[i];
    }
  }

  if (!inputPath) {
    console.error('❌ Error: Input file path required');
    process.exit(1);
  }

  inputPath = path.resolve(inputPath);
  outputPath = outputPath ? path.resolve(outputPath) : inputPath;

  transformFile(inputPath, outputPath, rootDir);
}

// Export for use as module
export {
  transformIndexHtml,
  angularIndexTransformer,
  readGitMetadata,
  findThemeLoadingAssets
};
