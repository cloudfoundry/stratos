/**
 * Zoneless Testing Framework
 *
 * This module exports all utilities and configurations needed for testing
 * Stratos components in zoneless mode (without Zone.js).
 *
 * @see zoneless-test-guide.md for comprehensive documentation
 * @see zoneless-example.spec.ts for working examples
 */

// Utility functions for managing change detection and async operations
export {
  detectChanges,
  waitForAsync,
  waitForCondition,
  getElement,
  getAllElements,
  simulateAsync,
  clickElement,
  setInputValue,
  dispatchEvent,
  waitForObservable,
  flushMicrotasks
} from './zoneless-test-utils';

// Reusable test provider configurations
export {
  zonelessTestProviders,
  zonelessTestProvidersWithHttp,
  zonelessTestProvidersWithRouter,
  zonelessTestProvidersFullStack,
  createTestProviders,
  createTestProvidersWithHttp,
  createTestProvidersWithRouter,
  TestConfigPresets
} from './test-config';

/**
 * Quick Start Guide:
 *
 * 1. Import utilities in your spec file:
 * ```typescript
 * import { detectChanges, TestConfigPresets } from '@stratosui/core/test-framework';
 * ```
 *
 * 2. Configure TestBed with zoneless providers:
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [YourComponent],
 *   providers: TestConfigPresets.simple
 * });
 * ```
 *
 * 3. Use detectChanges after state changes:
 * ```typescript
 * component.value = 'new value';
 * detectChanges(fixture);
 * expect(element.textContent).toContain('new value');
 * ```
 *
 * See zoneless-test-guide.md for complete documentation.
 */
