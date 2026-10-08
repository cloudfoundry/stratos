import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString
} from '@angular-devkit/architect';
import { buildApplication as angularBuildApplication } from '@angular-devkit/build-angular';
import { json } from '@angular-devkit/core';
import { execFileSync } from 'child_process';
import * as path from 'path';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { PrebuildApplicationBuilderSchema } from './schema';
import { PrebuildExecutor } from './prebuild-executor';
import { ProgressReporter } from './progress-reporter';

export function buildApplication(
  options: PrebuildApplicationBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const reporter = new ProgressReporter(context, options.verbose);

  // Skip prebuild if requested
  if (options.skipPrebuild) {
    reporter.info('Skipping prebuild phase (--skipPrebuild=true)');
    return delegateToAngularBuilder(options, context);
  }

  reporter.info('Starting prebuild phase...');

  const executor = new PrebuildExecutor(
    options,
    context,
    reporter
  );

  return from(executor.execute()).pipe(
    switchMap(result => {
      if (!result.success) {
        reporter.error('Prebuild phase failed');
        return of({ success: false });
      }

      reporter.success(
        `Prebuild complete (${result.totalDuration}ms, ` +
        `${result.cacheHits} cached, ${result.cacheMisses} executed)`
      );

      // Delegate to standard Angular builder
      return delegateToAngularBuilder(options, context);
    }),
    catchError(error => {
      reporter.error(`Prebuild error: ${error.message}`);
      return of({ success: false, error: error.message });
    })
  );
}

function delegateToAngularBuilder(
  options: PrebuildApplicationBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const target = targetFromTargetString(options.browserTarget);

  // Get the build-internal target options from the workspace
  return from(context.getTargetOptions(target)).pipe(
    switchMap((buildOptions: json.JsonObject) => {
      // Call Angular's buildApplication directly with the loaded options
      return from(angularBuildApplication(buildOptions as any, context)).pipe(
        map(result => transformIndex(buildOptions, context, result))
      );
    }),
    catchError(error => {
      context.logger.error(`Failed to run Angular builder: ${error.message}`);
      return of({ success: false, error: error.message });
    })
  );
}

/**
 * Inject the title, git metadata and theme loading assets into the built
 * index.html. The tracked source keeps plain defaults, so every build gets
 * fresh values and the source never changes.
 */
function transformIndex(
  buildOptions: json.JsonObject,
  context: BuilderContext,
  result: BuilderOutput
): BuilderOutput {
  if (!result.success) {
    return result;
  }
  const out = buildOptions.outputPath as string | { base: string; browser?: string };
  const browserDir = typeof out === 'string' ? path.join(out, 'browser') : path.join(out.base, out.browser ?? 'browser');
  const index = path.join(context.workspaceRoot, browserDir, 'index.html');
  try {
    execFileSync('bun', ['build/index-transformer.js', index], { cwd: context.workspaceRoot, stdio: 'inherit' });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.logger.error(`index.html transform failed: ${message}`);
    return { success: false, error: message };
  }
}

export default createBuilder(buildApplication);
