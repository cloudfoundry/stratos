"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const build_angular_1 = require("@angular-devkit/build-angular");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
/**
 * Run Stratos pre-build tools before Angular build
 */
async function runPreBuild(options, context) {
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
        (0, child_process_1.execSync)(`node "${script}"`, {
            cwd: context.workspaceRoot,
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: options.optimization ? 'production' : 'development'
            }
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        context.logger.info(`✅ Pre-build complete (${duration}s)`);
    }
    catch (error) {
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
exports.default = (0, architect_1.createBuilder)(async function* (options, context) {
    context.logger.info('🚀 Stratos Application Builder starting...');
    try {
        // Phase 1: Run Stratos pre-build tools
        await runPreBuild(options, context);
        // Phase 2: Delegate to Angular's application builder
        context.logger.info('🔨 Starting Angular application build...');
        // Remove our custom options before passing to Angular builder
        const buildOptions = { ...options };
        delete buildOptions.preBuildScript;
        delete buildOptions.skipPreBuild;
        // Execute Angular's application builder (returns async iterable)
        for await (const result of (0, build_angular_1.buildApplication)(buildOptions, context)) {
            if (result.success) {
                context.logger.info('✅ Build completed successfully');
            }
            else {
                context.logger.error('❌ Build failed');
            }
            yield result;
        }
    }
    catch (error) {
        context.logger.error('❌ Build process failed');
        context.logger.error(`   ${error instanceof Error ? error.message : String(error)}`);
        yield {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
});
