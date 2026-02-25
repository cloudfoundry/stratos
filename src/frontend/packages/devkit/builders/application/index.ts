import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { buildApplication, ApplicationBuilderOptions } from '@angular-devkit/build-angular';
import { execSync } from 'child_process';
import * as path from 'path';

export interface StratosApplicationBuilderOptions extends ApplicationBuilderOptions {
  /**
   * Path to pre-build orchestrator script
   * @default build/build-orchestrator.js
   */
  preBuildScript?: string;

  /**
   * Skip pre-build processing (useful for testing)
   * @default false
   */
  skipPreBuild?: boolean;
}

/**
 * Run Stratos pre-build tools before Angular build
 */
async function runPreBuild(
  options: StratosApplicationBuilderOptions,
  context: BuilderContext
): Promise<void> {
  if (options.skipPreBuild) {
    context.logger.info('⏭️  Skipping pre-build (skipPreBuild=true)');
    return;
  }

  const script = options.preBuildScript ||
    path.join(context.workspaceRoot, 'build/build-orchestrator.js');

  // Check if script exists
  const fs = require('fs');
  if (!fs.existsSync(script)) {
    context.logger.warn(`⚠️  Pre-build script not found: ${script}`);
    context.logger.warn('⚠️  Continuing without pre-build...');
    return;
  }

  context.logger.info('🔧 Running Stratos pre-build orchestrator...');
  context.logger.info(`   Script: ${script}`);

  try {
    const startTime = Date.now();

    execSync(`node "${script}"`, {
      cwd: context.workspaceRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: options.optimization ? 'production' : 'development'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    context.logger.info(`✅ Pre-build complete (${duration}s)`);
  } catch (error) {
    context.logger.error('❌ Pre-build failed');
    context.logger.error(`   ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('Pre-build orchestrator failed');
  }
}

/**
 * Stratos Application Builder
 *
 * This builder extends Angular's application builder with Stratos-specific
 * pre-build processing:
 *
 * 1. Runs pre-build orchestrator (customizations, theming, assets, metadata, devkit)
 * 2. Delegates to Angular's application builder for compilation
 *
 * Configuration in angular.json:
 * ```json
 * {
 *   "architect": {
 *     "build": {
 *       "builder": "@stratos/esbuild-builder:application",
 *       "options": {
 *         "preBuildScript": "build/build-orchestrator.js",
 *         "skipPreBuild": false,
 *         ...standardAngularOptions
 *       }
 *     }
 *   }
 * }
 * ```
 */
export default createBuilder<StratosApplicationBuilderOptions & JsonObject>(
  async function* (options, context): AsyncIterable<BuilderOutput> {
    context.logger.info('🚀 Stratos Application Builder starting...');

    try {
      // Phase 1: Run Stratos pre-build tools
      await runPreBuild(options, context);

      // Phase 2: Delegate to Angular's application builder
      context.logger.info('🔨 Starting Angular application build...');

      // Remove our custom options before passing to Angular builder
      const buildOptions = { ...options };
      delete (buildOptions as any).preBuildScript;
      delete (buildOptions as any).skipPreBuild;

      // Execute Angular's application builder (returns async iterable)
      for await (const result of buildApplication(buildOptions, context)) {
        if (result.success) {
          context.logger.info('✅ Build completed successfully');
        } else {
          context.logger.error('❌ Build failed');
        }
        yield result;
      }
    } catch (error) {
      context.logger.error('❌ Build process failed');
      context.logger.error(`   ${error instanceof Error ? error.message : String(error)}`);

      yield {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
);
