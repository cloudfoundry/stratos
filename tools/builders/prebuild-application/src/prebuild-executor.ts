import { BuilderContext } from '@angular-devkit/architect';
import { PrebuildApplicationBuilderSchema, PrebuildScript } from './schema';
import { PrebuildResult, ScriptExecution } from './types';
import { ScriptRunner } from './script-runner';
import { CacheManager } from './cache-manager';
import { ProgressReporter } from './progress-reporter';

export class PrebuildExecutor {
  private runner: ScriptRunner;
  private cache: CacheManager;

  constructor(
    private options: PrebuildApplicationBuilderSchema,
    private context: BuilderContext,
    private reporter: ProgressReporter
  ) {
    this.runner = new ScriptRunner(context, reporter);
    this.cache = new CacheManager(context.workspaceRoot, options.clearCache);
  }

  async execute(): Promise<PrebuildResult> {
    const startTime = Date.now();
    const scripts = this.options.prebuildScripts || [];

    if (scripts.length === 0) {
      this.reporter.warn('No prebuild scripts configured');
      return {
        success: true,
        executions: [],
        totalDuration: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }

    // Group scripts by phase
    const phases = this.groupByPhase(scripts);
    const executions: ScriptExecution[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Execute each phase
    for (const [phase, phaseScripts] of phases) {
      this.reporter.info(`Phase ${phase}: ${phaseScripts.length} script(s)`);

      // Execute scripts in phase (parallel)
      const results = await Promise.all(
        phaseScripts.map(script => this.executeScript(script))
      );

      executions.push(...results);

      // Check for failures
      const failures = results.filter(r => !r.cached && r.exitCode !== 0);
      if (failures.length > 0) {
        const required = failures.filter(f =>
          phaseScripts.find(s => s.script === f.script.script)?.required !== false
        );

        if (required.length > 0) {
          this.reporter.error(`${required.length} required script(s) failed`);
          return {
            success: false,
            executions,
            totalDuration: Date.now() - startTime,
            cacheHits,
            cacheMisses
          };
        }
      }

      // Count cache stats
      cacheHits += results.filter(r => r.cached).length;
      cacheMisses += results.filter(r => !r.cached).length;
    }

    return {
      success: true,
      executions,
      totalDuration: Date.now() - startTime,
      cacheHits,
      cacheMisses
    };
  }

  private groupByPhase(scripts: PrebuildScript[]): Map<number, PrebuildScript[]> {
    const phases = new Map<number, PrebuildScript[]>();

    for (const script of scripts) {
      const phase = script.phase || 1;
      if (!phases.has(phase)) {
        phases.set(phase, []);
      }
      phases.get(phase)!.push(script);
    }

    return new Map([...phases.entries()].sort((a, b) => a[0] - b[0]));
  }

  private async executeScript(script: PrebuildScript): Promise<ScriptExecution> {
    // Check cache
    if (script.cache !== false) {
      const cached = await this.cache.get(script);
      if (cached) {
        this.reporter.cached(script.name);
        return {
          script,
          output: cached.output || '',
          exitCode: 0,
          duration: 0,
          cached: true
        };
      }
    }

    // Execute script
    this.reporter.start(script.name);
    const result = await this.runner.execute(script);

    // Update cache on success
    if (result.exitCode === 0 && script.cache !== false) {
      await this.cache.set(script, result.output);
    }

    if (result.exitCode !== 0) {
      this.reporter.failed(script.name, result.exitCode);
    } else {
      this.reporter.complete(script.name, result.duration);
    }

    return result;
  }
}
