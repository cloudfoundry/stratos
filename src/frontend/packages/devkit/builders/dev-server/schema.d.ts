import { DevServerBuilderOptions } from '@angular-devkit/build-angular';

/**
 * Stratos Dev Server Builder Options
 * Extends Angular's dev-server builder
 */
export interface Schema extends DevServerBuilderOptions {
  // Inherits all options from Angular's dev-server builder
  // Pre-build processing is handled by the application builder
}
