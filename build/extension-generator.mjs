#!/usr/bin/env node
/**
 * extension-generator.js
 * Generates _custom-import.module.ts for extension loading
 * Replaces webpack's NormalModuleReplacementPlugin functionality
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Package information structure
 */
class PackageInfo {
  constructor(name, dir, pkg) {
    this.name = name;
    this.dir = dir;
    this.json = pkg;
    this.stratos = pkg.stratos || {};
    this.extension = this.extractExtension();
  }

  extractExtension() {
    if (this.stratos.module || this.stratos.routingModule) {
      return {
        package: this.name,
        module: this.stratos.module,
        routingModule: this.stratos.routingModule
      };
    }
    return null;
  }

  hasExtension() {
    return this.extension !== null;
  }
}

/**
 * Extension Generator
 */
class ExtensionGenerator {
  constructor(rootDir, outputPath, options = {}) {
    this.rootDir = rootDir;
    this.outputPath = outputPath;
    this.options = {
      verbose: false,
      ...options
    };
    this.packages = [];
    this.packageMap = new Map();
    this.config = null;
  }

  log(msg) {
    if (this.options.verbose) {
      console.log(msg);
    }
  }

  error(msg) {
    console.error(`ERROR: ${msg}`);
  }

  /**
   * Load stratos.yaml configuration
   */
  loadConfig() {
    const stratosYamlPath = process.env.STRATOS_YAML ||
                           path.join(this.rootDir, 'stratos.yaml');

    if (fs.existsSync(stratosYamlPath)) {
      try {
        this.config = yaml.load(fs.readFileSync(stratosYamlPath, 'utf8'));
        this.log(`Loaded config from: ${stratosYamlPath}`);
      } catch (e) {
        this.error(`Failed to parse stratos.yaml: ${e.message}`);
        this.config = {};
      }
    } else {
      this.log('No stratos.yaml found, using defaults');
      this.config = {};
    }

    // Apply default excludes
    this.applyDefaultExcludes();

    return this.config;
  }

  /**
   * Apply default package excludes unless explicitly included
   */
  applyDefaultExcludes() {
    let defaultExcluded = [
      '@example/theme',
      '@example/extensions',
      '@stratosui/desktop-extensions'
    ];

    // Enable desktop package if configured
    if (this.config?.packages?.desktop) {
      defaultExcluded = defaultExcluded.filter(p => p !== '@stratosui/desktop-extensions');
      this.log('Building with desktop package');
    }

    // Initialize packages config if needed
    if (!this.config.packages) {
      this.config.packages = {};
    }
    if (!this.config.packages.exclude) {
      this.config.packages.exclude = [];
    }

    // Check which defaults should be excluded
    const included = this.config.packages.include || [];
    const toExclude = defaultExcluded.filter(pkg => !included.includes(pkg));

    // Add to exclude list
    toExclude.forEach(pkg => {
      if (!this.config.packages.exclude.includes(pkg)) {
        this.config.packages.exclude.push(pkg);
      }
    });

    // Handle STRATOS_BUILD_REMOVE environment variable
    const buildRemove = process.env.STRATOS_BUILD_REMOVE || '';
    if (buildRemove) {
      this.log(`Detected STRATOS_BUILD_REMOVE: ${buildRemove}`);
      buildRemove.split(',').forEach(pkg => {
        const trimmed = pkg.trim();
        if (trimmed && !this.config.packages.exclude.includes(trimmed)) {
          this.config.packages.exclude.push(trimmed);
        }
      });
    }
  }

  /**
   * Scan for packages in the monorepo
   */
  scanPackages() {
    const packagesDir = path.join(this.rootDir, 'src/frontend/packages');

    if (!fs.existsSync(packagesDir)) {
      this.error(`Packages directory not found: ${packagesDir}`);
      return [];
    }

    this.log(`Scanning packages in: ${packagesDir}`);

    // Read all directories in packages folder
    const entries = fs.readdirSync(packagesDir);

    for (const entry of entries) {
      const pkgDir = path.join(packagesDir, entry);

      if (!fs.statSync(pkgDir).isDirectory()) {
        continue;
      }

      const pkgJsonPath = path.join(pkgDir, 'package.json');

      if (!fs.existsSync(pkgJsonPath)) {
        this.log(`No package.json in ${entry}, skipping`);
        continue;
      }

      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

        // Only process packages with stratos metadata
        if (!pkgJson.stratos) {
          this.log(`Package ${entry} has no stratos metadata, skipping`);
          continue;
        }

        const pkgInfo = new PackageInfo(pkgJson.name, pkgDir, pkgJson);

        // Check if package should be included
        if (this.shouldIncludePackage(pkgInfo)) {
          this.packages.push(pkgInfo);
          this.packageMap.set(pkgInfo.name, pkgInfo);
          this.log(`Added package: ${pkgInfo.name}`);
        } else {
          this.log(`Excluded package: ${pkgInfo.name}`);
        }
      } catch (e) {
        this.error(`Failed to read package.json for ${entry}: ${e.message}`);
      }
    }

    return this.packages;
  }

  /**
   * Determine if a package should be included
   */
  shouldIncludePackage(pkgInfo) {
    const packages = this.config.packages || {};

    // If there's an explicit include list, package must be in it
    if (packages.include && Array.isArray(packages.include)) {
      return packages.include.includes(pkgInfo.name);
    }

    // Otherwise, check exclude list
    if (packages.exclude && Array.isArray(packages.exclude)) {
      return !packages.exclude.includes(pkgInfo.name);
    }

    // Default to include
    return true;
  }

  /**
   * Get all extensions from scanned packages
   */
  getExtensions() {
    return this.packages
      .filter(pkg => pkg.hasExtension())
      .map(pkg => pkg.extension);
  }

  /**
   * Generate TypeScript import statement
   */
  generateImport(extension) {
    const modules = [];

    if (extension.module) {
      modules.push(extension.module);
    }
    if (extension.routingModule) {
      modules.push(extension.routingModule);
    }

    if (modules.length === 0) {
      return '';
    }

    return `import { ${modules.join(', ')} } from '${extension.package}';`;
  }

  /**
   * Generate NgModule decorator
   */
  generateModule(name, imports) {
    const lines = [];
    lines.push('');
    lines.push('@NgModule({');
    lines.push('  imports: [');

    imports.forEach((imp, index) => {
      const comma = index < imports.length - 1 ? ',' : '';
      lines.push(`    ${imp}${comma}`);
    });

    lines.push('  ]');
    lines.push('})');
    lines.push(`export class ${name} {}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate the _custom-import.module.ts file
   */
  generate() {
    const extensions = this.getExtensions();

    if (extensions.length === 0) {
      this.log('No extensions found, generating empty module');
    } else {
      this.log(`Generating module with ${extensions.length} extensions:`);
      extensions.forEach(ext => this.log(`  + ${ext.package}`));
    }

    const lines = [];

    // File header
    lines.push('// AUTO-GENERATED - DO NOT EDIT');
    lines.push('// Generated by extension-generator.js');
    lines.push('');
    lines.push("import { NgModule } from '@angular/core';");

    // Collect imports and module references
    const moduleImports = [];
    const routingImports = [];

    // Generate imports
    extensions.forEach(ext => {
      const importLine = this.generateImport(ext);
      if (importLine) {
        lines.push(importLine);

        if (ext.module) {
          moduleImports.push(ext.module);
        }
        if (ext.routingModule) {
          routingImports.push(ext.routingModule);
        }
      }
    });

    // Generate CustomImportModule
    lines.push(this.generateModule('CustomImportModule', moduleImports));

    // Generate CustomRoutingImportModule
    lines.push(this.generateModule('CustomRoutingImportModule', routingImports));

    // Write file
    const content = lines.join('\n');

    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(this.outputPath, content, 'utf8');
      console.log(`✓ Generated: ${this.outputPath}`);
      return true;
    } catch (e) {
      this.error(`Failed to write output file: ${e.message}`);
      return false;
    }
  }

  /**
   * Run the full generation process
   */
  run() {
    console.log('Extension Generator');
    console.log('==================');

    // Load configuration
    this.loadConfig();

    // Scan packages
    this.scanPackages();

    // Generate output
    return this.generate();
  }
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let rootDir = process.cwd();
  let outputPath = null;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--root' && i + 1 < args.length) {
      rootDir = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      outputPath = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: extension-generator.js [options]');
      console.log('');
      console.log('Options:');
      console.log('  --root <dir>      Root directory (default: current directory)');
      console.log('  --output <file>   Output file path (default: auto-detect)');
      console.log('  --verbose, -v     Verbose output');
      console.log('  --help, -h        Show this help');
      console.log('');
      console.log('Environment Variables:');
      console.log('  STRATOS_YAML              Path to stratos.yaml');
      console.log('  STRATOS_BUILD_REMOVE      Comma-separated packages to exclude');
      process.exit(0);
    }
  }

  // Auto-detect output path if not specified
  if (!outputPath) {
    outputPath = path.join(
      rootDir,
      'src/frontend/packages/core/src/_custom-import.module.ts'
    );
  }

  // Resolve paths
  rootDir = path.resolve(rootDir);
  outputPath = path.resolve(outputPath);

  // Run generator
  const generator = new ExtensionGenerator(rootDir, outputPath, { verbose });
  const success = generator.run();

  process.exit(success ? 0 : 1);
}

// Export for testing
export { ExtensionGenerator, PackageInfo };

// Run if called directly (ES module version)
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}
