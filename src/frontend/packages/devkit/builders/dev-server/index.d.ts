import { JsonObject } from '@angular-devkit/core';
import { DevServerBuilderOptions } from '@angular-devkit/build-angular';
export interface StratosDevServerBuilderOptions extends DevServerBuilderOptions {
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
declare const _default: import("@angular-devkit/architect").Builder<StratosDevServerBuilderOptions & JsonObject>;
export default _default;
