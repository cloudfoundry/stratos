import { BuilderContext } from '@angular-devkit/architect';
import { logging } from '@angular-devkit/core';

export class ProgressReporter {
  private logger: logging.LoggerApi;

  constructor(
    context: BuilderContext,
    private verbose: boolean = false
  ) {
    this.logger = context.logger;
  }

  info(message: string): void {
    this.logger.info(`ℹ ${message}`);
  }

  success(message: string): void {
    this.logger.info(`✔ ${message}`);
  }

  warn(message: string): void {
    this.logger.warn(`⚠ ${message}`);
  }

  error(message: string): void {
    this.logger.error(`✖ ${message}`);
  }

  start(scriptName: string): void {
    this.logger.info(`  ▶ Running: ${scriptName}`);
  }

  complete(scriptName: string, duration: number): void {
    this.logger.info(`  ✔ ${scriptName} (${duration}ms)`);
  }

  cached(scriptName: string): void {
    this.logger.info(`  ⚡ ${scriptName} (cached)`);
  }

  failed(scriptName: string, exitCode: number): void {
    this.logger.error(`  ✖ ${scriptName} failed (exit ${exitCode})`);
  }

  scriptOutput(scriptName: string, output: string): void {
    if (this.verbose) {
      output.split('\n').forEach(line => {
        if (line.trim()) {
          this.logger.info(`    ${line}`);
        }
      });
    }
  }

  scriptError(scriptName: string, error: string): void {
    error.split('\n').forEach(line => {
      if (line.trim()) {
        this.logger.error(`    ${line}`);
      }
    });
  }
}
