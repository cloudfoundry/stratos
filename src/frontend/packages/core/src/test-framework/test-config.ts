import type { Provider, EnvironmentProviders } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

/**
 * Zoneless Test Configuration
 *
 * Provides reusable test provider configurations for zoneless testing.
 * Import and use these in your test configurations to ensure consistency.
 */

/**
 * Essential zoneless providers
 *
 * Minimum required providers for zoneless component testing.
 * Use this for simple component tests that don't need HTTP or routing.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: [
 *     ...zonelessTestProviders,
 *     // Add component-specific providers
 *   ]
 * });
 * ```
 */
export const zonelessTestProviders: (Provider | EnvironmentProviders)[] = [
  provideZonelessChangeDetection(),
  provideAnimations()
];

/**
 * Full test providers including HTTP client testing
 *
 * Use this for components/services that make HTTP requests.
 * Includes HttpTestingController for mocking HTTP requests.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: [
 *     ...zonelessTestProvidersWithHttp,
 *     MyService
 *   ]
 * });
 *
 * const httpMock = TestBed.inject(HttpTestingController);
 * ```
 */
export const zonelessTestProvidersWithHttp: (Provider | EnvironmentProviders)[] = [
  ...zonelessTestProviders,
  provideHttpClient(),
  provideHttpClientTesting()
];

/**
 * Test providers with routing support
 *
 * Use this for components that use Router, ActivatedRoute, etc.
 * Provides a minimal router configuration for testing.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: [
 *     ...zonelessTestProvidersWithRouter,
 *     // Add component-specific providers
 *   ]
 * });
 * ```
 */
export const zonelessTestProvidersWithRouter: (Provider | EnvironmentProviders)[] = [
  ...zonelessTestProviders,
  provideRouter([]) // Empty routes for testing
];

/**
 * Full stack test providers
 *
 * Includes everything: zoneless, HTTP, animations, and routing.
 * Use this for integration tests or complex components.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyFeatureModule],
 *   providers: [
 *     ...zonelessTestProvidersFullStack,
 *     // Add feature-specific providers
 *   ]
 * });
 * ```
 */
export const zonelessTestProvidersFullStack: (Provider | EnvironmentProviders)[] = [
  provideZonelessChangeDetection(),
  provideAnimations(),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([])
];

/**
 * Create custom test provider set
 *
 * Helper function to create a custom provider set with optional additions.
 *
 * @param additionalProviders - Additional providers to include
 * @returns Combined provider array
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: createTestProviders([
 *     MyService,
 *     { provide: CONFIG_TOKEN, useValue: testConfig }
 *   ])
 * });
 * ```
 */
export function createTestProviders(additionalProviders: (Provider | EnvironmentProviders)[] = []): (Provider | EnvironmentProviders)[] {
  return [
    ...zonelessTestProviders,
    ...additionalProviders
  ];
}

/**
 * Create test providers with HTTP
 *
 * Helper function to create providers with HTTP testing support.
 *
 * @param additionalProviders - Additional providers to include
 * @returns Combined provider array
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: createTestProvidersWithHttp([
 *     MyHttpService
 *   ])
 * });
 * ```
 */
export function createTestProvidersWithHttp(additionalProviders: (Provider | EnvironmentProviders)[] = []): (Provider | EnvironmentProviders)[] {
  return [
    ...zonelessTestProvidersWithHttp,
    ...additionalProviders
  ];
}

/**
 * Create test providers with routing
 *
 * Helper function to create providers with routing support.
 *
 * @param additionalProviders - Additional providers to include
 * @returns Combined provider array
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: createTestProvidersWithRouter([
 *     { provide: ActivatedRoute, useValue: mockActivatedRoute }
 *   ])
 * });
 * ```
 */
export function createTestProvidersWithRouter(additionalProviders: (Provider | EnvironmentProviders)[] = []): (Provider | EnvironmentProviders)[] {
  return [
    ...zonelessTestProvidersWithRouter,
    ...additionalProviders
  ];
}

/**
 * Test configuration presets for common scenarios
 */
export const TestConfigPresets = {
  /**
   * Simple component test (no HTTP, no routing)
   */
  simple: zonelessTestProviders,

  /**
   * Component with HTTP calls
   */
  withHttp: zonelessTestProvidersWithHttp,

  /**
   * Component with routing
   */
  withRouter: zonelessTestProvidersWithRouter,

  /**
   * Full integration test
   */
  fullStack: zonelessTestProvidersFullStack
} as const;

/**
 * Example usage in tests:
 *
 * // Simple component
 * TestBed.configureTestingModule({
 *   imports: [SimpleComponent],
 *   providers: TestConfigPresets.simple
 * });
 *
 * // Component with HTTP
 * TestBed.configureTestingModule({
 *   imports: [DataComponent],
 *   providers: TestConfigPresets.withHttp
 * });
 *
 * // Custom configuration
 * TestBed.configureTestingModule({
 *   imports: [ComplexComponent],
 *   providers: createTestProvidersWithHttp([
 *     MyService,
 *     { provide: API_URL, useValue: 'http://test-api' }
 *   ])
 * });
 */
