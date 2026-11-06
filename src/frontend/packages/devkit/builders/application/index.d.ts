import { JsonObject } from '@angular-devkit/core';
import { ApplicationBuilderOptions } from '@angular-devkit/build-angular';
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
declare const _default: import("@angular-devkit/architect").Builder<StratosApplicationBuilderOptions & JsonObject>;
export default _default;
