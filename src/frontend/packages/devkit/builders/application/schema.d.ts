import { ApplicationBuilderOptions } from '@angular-devkit/build-angular';

/**
 * Stratos Application Builder Options
 * Extends Angular's application builder with Stratos-specific options
 */
export interface Schema extends ApplicationBuilderOptions {
  /**
   * Path to pre-build orchestrator script
   * @default build/build-orchestrator.js
   */
  preBuildScript?: string;

  /**
   * Skip pre-build processing for testing or debugging
   * @default false
   */
  skipPreBuild?: boolean;
}
