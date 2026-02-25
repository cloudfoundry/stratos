#!/usr/bin/env node
/**
 * build-orchestrator.js
 * Coordinates all pre-build tools for Stratos
 *
 * Executes build tools in dependency order:
 * 1. Extension Generator → _custom-import.module.ts
 * 2. SASS Resolver → processed SCSS (if needed)
 * 3. Asset Copier → dist/assets
 * 4. Index Transformer → inject metadata
 * 5. Signal ready for Angular build
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tool definitions with dependencies and requirements
const tools = [
  {
    name: 'Backend Plugin Generator',
    script: '../src/frontend/packages/devkit/src/backend.ts',
    required: true,
    description: 'Generates extra_plugins.go for Jetstream backend',
    watchPaths: ['src/frontend/packages/*/package.json'],
    useTsx: true  // Run with tsx for TypeScript support
  },
  {
    name: 'Extension Generator',
    script: './extension-generator.mjs',
    required: true,
    description: 'Generates _custom-import.module.ts from stratos.yaml',
    watchPaths: ['stratos.yaml', 'src/frontend/packages/*/package.json']
  },
  {
    name: 'SASS Resolver',
    script: './sass-resolver.js',
    args: ['--analyze'],
    required: false,
    description: 'Analyzes SASS imports',
    watchPaths: ['src/**/*.scss', 'src/**/*.sass']
  },
  {
    name: 'Asset Copier',
    script: './asset-copier.js',
    required: true,
    description: 'Copies assets to dist directory',
    watchPaths: ['src/**/assets/**/*']
  },
  {
    name: 'Index Transformer',
    script: './index-transformer.js',
    args: ['src/frontend/packages/core/src/index.html'],
    required: false,
    description: 'Transforms index.html with metadata injection',
    watchPaths: ['src/index.html', 'package.json']
  }
];

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `${colors.dim}[${timestamp}]${colors.reset}`;

  switch (level) {
    case 'info':
      console.log(`${prefix} ${colors.cyan}ℹ${colors.reset} ${message}`);
      break;
    case 'success':
      console.log(`${prefix} ${colors.green}✅${colors.reset} ${message}`);
      break;
    case 'error':
      console.error(`${prefix} ${colors.red}❌${colors.reset} ${message}`);
      break;
    case 'warning':
      console.warn(`${prefix} ${colors.yellow}⚠️${colors.reset} ${message}`);
      break;
    case 'start':
      console.log(`${prefix} ${colors.blue}▶${colors.reset} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Run a single build tool
 */
async function runTool(tool, context = {}) {
  const toolPath = path.resolve(__dirname, tool.script);

  // Check if tool exists
  if (!fs.existsSync(toolPath)) {
    if (tool.required) {
      log('error', `Required tool not found: ${tool.script}`);
      throw new Error(`Missing required tool: ${tool.script}`);
    } else {
      log('warning', `Optional tool not found: ${tool.script} (skipping)`);
      return { success: true, skipped: true };
    }
  }

  log('start', `${colors.bright}${tool.name}${colors.reset} - ${tool.description}`);
  const startTime = Date.now();

  try {
    // Execute tool with inherited stdio for real-time output
    // Run from project root, not from build directory
    const projectRoot = path.resolve(__dirname, '..');
    const args = tool.args ? (Array.isArray(tool.args) ? tool.args.join(' ') : tool.args) : '';
    
    // Use tsx for TypeScript files, node for JavaScript
    const runner = tool.useTsx ? 'npx tsx' : 'node';
    const command = `${runner} ${toolPath} ${args}`.trim();
    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
        ...context.env
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('success', `${tool.name} completed in ${duration}s`);

    return { success: true, duration: parseFloat(duration) };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('error', `${tool.name} failed after ${duration}s`);

    if (tool.required) {
      throw new Error(`Required tool failed: ${tool.name}`);
    } else {
      log('warning', `Optional tool failed: ${tool.name} (continuing)`);
      return { success: false, duration: parseFloat(duration), error: error.message };
    }
  }
}

/**
 * Main orchestration function
 */
async function orchestrate(options = {}) {
  console.log(`\n${colors.bright}${colors.cyan}🚀 Stratos Pre-build Pipeline${colors.reset}\n`);

  const startTime = Date.now();
  const results = [];

  try {
    // Run tools in sequence
    for (const tool of tools) {
      const result = await runTool(tool, options);
      results.push({ tool: tool.name, ...result });
    }

    // Calculate summary
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter(r => r.success && !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;
    const failedCount = results.filter(r => !r.success).length;

    // Display summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`  ✅ Successful: ${successCount}`);
    if (skippedCount > 0) {
      console.log(`  ⊘  Skipped: ${skippedCount}`);
    }
    if (failedCount > 0) {
      console.log(`  ❌ Failed: ${failedCount}`);
    }
    console.log(`  ⏱  Total time: ${totalDuration}s\n`);

    log('success', `${colors.bright}Pre-build pipeline complete${colors.reset}`);

    return { success: true, results, duration: parseFloat(totalDuration) };
  } catch (error) {
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('error', `Pre-build pipeline failed after ${totalDuration}s`);
    log('error', error.message);

    return { success: false, error: error.message, results, duration: parseFloat(totalDuration) };
  }
}

/**
 * Watch mode implementation
 */
async function watchMode() {
  let chokidar;
  try {
    chokidar = (await import('chokidar')).default;
  } catch (error) {
    log('error', 'Watch mode requires chokidar package');
    log('info', 'Install with: npm install --save-dev chokidar');
    process.exit(1);
  }

  log('info', `${colors.bright}Watch mode enabled${colors.reset}`);
  console.log('');

  // Create watchers for each tool
  tools.forEach(tool => {
    if (!tool.watchPaths || tool.watchPaths.length === 0) return;

    const watcher = chokidar.watch(tool.watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filepath) => {
      log('info', `File changed: ${filepath}`);
      log('info', `Triggering: ${tool.name}`);

      try {
        await runTool(tool);
      } catch (error) {
        log('error', `Watch execution failed: ${error.message}`);
      }

      console.log(''); // blank line for readability
    });

    log('info', `Watching: ${tool.watchPaths.join(', ')}`);
  });

  console.log(`\n${colors.dim}Press Ctrl+C to stop watching${colors.reset}\n`);
}

/**
 * CLI argument parsing
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    watch: false,
    help: false,
    verbose: false,
    env: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        options.env.VERBOSE = 'true';
        break;
      default:
        if (arg.startsWith('--')) {
          log('warning', `Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bright}Stratos Build Orchestrator${colors.reset}

Coordinates all pre-build tools in the correct order before Angular build.

${colors.bright}Usage:${colors.reset}
  node build-orchestrator.js [options]

${colors.bright}Options:${colors.reset}
  -w, --watch      Watch mode - rerun tools when files change
  -v, --verbose    Verbose output
  -h, --help       Show this help message

${colors.bright}Tools executed (in order):${colors.reset}
${tools.map((t, i) => `  ${i + 1}. ${t.name} ${t.required ? '' : '(optional)'}\n     ${colors.dim}${t.description}${colors.reset}`).join('\n')}

${colors.bright}Examples:${colors.reset}
  node build-orchestrator.js                # Run once
  node build-orchestrator.js --watch        # Watch mode
  node build-orchestrator.js --verbose      # Verbose output

${colors.bright}Integration:${colors.reset}
  Add to package.json scripts:
  "prebuild": "node build-tools/build-orchestrator.js"
  "prebuild:watch": "node build-tools/build-orchestrator.js --watch"
`);
}

/**
 * Main entry point
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Run initial build
  const result = await orchestrate(options);

  if (!result.success) {
    process.exit(1);
  }

  // Enter watch mode if requested
  if (options.watch) {
    watchMode();
    // Keep process alive in watch mode
    await new Promise(() => {}); // Never resolves
  }
}

// Execute if called directly (ES module version)
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main().catch(error => {
    log('error', `Fatal error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

// Export for programmatic use
export {
  orchestrate,
  runTool,
  tools
};
