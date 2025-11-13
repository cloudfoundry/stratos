import { TestBed, TestModuleMetadata } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

/**
 * Configure TestBed with zoneless change detection for Angular 20
 *
 * This helper automatically injects `provideZonelessChangeDetection()` into the TestBed
 * configuration, ensuring all tests work correctly in zoneless mode.
 *
 * @param config - Standard TestModuleMetadata configuration
 * @returns Configured TestBed instance for chaining
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await configureZonelessTestBed({
 *     declarations: [MyComponent],
 *     imports: [MyModule],
 *     providers: [MyService]
 *   }).compileComponents();
 * });
 * ```
 *
 * @example With existing providers
 * ```typescript
 * beforeEach(async () => {
 *   await configureZonelessTestBed({
 *     providers: [
 *       MyService,
 *       { provide: CONFIG_TOKEN, useValue: mockConfig }
 *     ]
 *   }).compileComponents();
 * });
 * ```
 */
export function configureZonelessTestBed(config: TestModuleMetadata): typeof TestBed {
  // Ensure providers array exists
  const providers = config.providers || [];

  // Check if provideZonelessChangeDetection is already included
  const hasZonelessProvider = providers.some(
    provider =>
      typeof provider === 'function' &&
      provider.name === 'provideZonelessChangeDetection'
  );

  // Add zoneless provider if not already present
  const updatedConfig: TestModuleMetadata = {
    ...config,
    providers: hasZonelessProvider
      ? providers
      : [...providers, provideZonelessChangeDetection()]
  };

  return TestBed.configureTestingModule(updatedConfig);
}
