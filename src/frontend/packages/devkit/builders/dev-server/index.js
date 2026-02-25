"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const build_angular_1 = require("@angular-devkit/build-angular");
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
exports.default = (0, architect_1.createBuilder)((options, context) => {
    context.logger.info('🚀 Stratos Dev Server starting...');
    try {
        // Delegate entirely to Angular's dev-server builder
        // The application builder (referenced by buildTarget) handles pre-build
        return (0, build_angular_1.executeDevServerBuilder)(options, context);
    }
    catch (error) {
        context.logger.error('❌ Dev server process failed');
        context.logger.error(`   ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
});
