import { createBuilder } from '@angular-devkit/architect';
import type { JsonObject } from '@angular-devkit/core';
import { executeDevServerBuilder, type DevServerBuilderOptions, type DevServerBuilderOutput } from '@angular-devkit/build-angular';
import type { Observable } from 'rxjs';

export interface StratosDevServerBuilderOptions extends DevServerBuilderOptions {
  // Inherits all dev server options from Angular
  // Pre-build is handled by the application builder
}

/**
 * Stratos Dev Server Builder
 *
 * This builder extends Angular's dev-server builder.
 * Pre-build processing is delegated to the application builder which
 * runs the pre-build orchestrator automatically.
 *
 * Configuration in angular.json:
 * ```json
 * {
 *   "architect": {
 *     "serve": {
 *       "builder": "@stratos/esbuild-builder:dev-server",
 *       "options": {
 *         "buildTarget": "stratos:build",
 *         ...standardDevServerOptions
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * The dev server will:
 * 1. Invoke the application builder (which runs pre-build)
 * 2. Watch for file changes
 * 3. Serve the application with hot module replacement
 */
export default createBuilder<StratosDevServerBuilderOptions & JsonObject>(
  (options, context): Observable<DevServerBuilderOutput> => {
    context.logger.info('🚀 Stratos Dev Server starting...');

    try {
      // Delegate entirely to Angular's dev-server builder
      // The application builder (referenced by buildTarget) handles pre-build
      return executeDevServerBuilder(options, context);
    } catch (error) {
      context.logger.error('❌ Dev server process failed');
      context.logger.error(`   ${error instanceof Error ? error.message : String(error)}`);

      throw error;
    }
  }
);
