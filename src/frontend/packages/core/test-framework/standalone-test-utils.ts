/**
 * Standalone Component/Pipe/Directive Testing Utilities
 *
 * Provides helper functions and patterns for testing standalone components,
 * pipes, and directives in Angular 20 with zoneless change detection.
 *
 * Key patterns:
 * - Standalone components/pipes/directives must be imported, never declared
 * - Non-standalone test wrappers should be declared
 * - This ensures proper module compatibility in TestBed configuration
 */

import { Component, type Type } from '@angular/core';
import type { TestBedStatic } from '@angular/core/testing';

/**
 * Interface for test host component configuration
 */
export interface TestHostConfig {
  selector?: string;
  template: string;
  standalone?: boolean;
  imports?: any[];
  providers?: any[];
  styles?: string[];
}

/**
 * Creates a non-standalone test wrapper component that can host a standalone component
 * Useful for testing standalone components in isolation
 *
 * Example:
 * ```typescript
 * @Component({
 *   standalone: false,
 *   template: `<app-my-component [input]="testInput"></app-my-component>`
 * })
 * class TestHostComponent {
 *   @Input() testInput: any;
 * }
 * ```
 *
 * In TestBed:
 * - TestHostComponent goes in declarations (non-standalone)
 * - MyComponent goes in imports (standalone)
 */
export function createNonStandaloneTestHost(config: TestHostConfig): Type<any> {
  @Component({
    selector: config.selector || 'app-test-host',
    template: config.template,
    standalone: false,
    styles: config.styles
  })
  class TestHostComponent { }
  return TestHostComponent;
}

/**
 * Helper to properly configure TestBed for standalone components
 *
 * Example usage:
 * ```typescript
 * beforeEach(() => {
 *   configureStandaloneTestBed(TestBed, {
 *     imports: [MyStandaloneComponent, MyStandalonePipe],
 *     providers: [MyService]
 *   });
 * });
 * ```
 */
export interface StandaloneTestBedConfig {
  imports?: any[];
  providers?: any[];
  declarations?: any[];
  schemas?: any[];
}

export function configureStandaloneTestBed(
  testBed: TestBedStatic,
  config: StandaloneTestBedConfig
): void {
  const { imports = [], providers = [], declarations = [], schemas = [] } = config;

  testBed.configureTestingModule({
    imports,
    providers,
    declarations,
    schemas
  }).compileComponents();
}

/**
 * Guidelines for Angular 20 Zoneless Standalone Components Testing:
 *
 * 1. STANDALONE COMPONENTS/PIPES/DIRECTIVES:
 *    - Must be added to TestBed imports array
 *    - Example:
 *      ```
 *      imports: [
 *        MyStandaloneComponent,
 *        MyStandalonePipe,
 *        ...otherImports
 *      ]
 *      ```
 *
 * 2. NON-STANDALONE TEST WRAPPERS:
 *    - Helper components marked with standalone: false
 *    - Should be added to TestBed declarations array
 *    - Used to test standalone components in isolation
 *    - Example:
 *      ```
 *      declarations: [TestHostComponent]
 *      imports: [MyStandaloneComponent]
 *      ```
 *
 * 3. ZONELESS CHANGE DETECTION:
 *    - Required: import { provideZonelessChangeDetection } from '@angular/core'
 *    - Must be added to TestBed providers
 *    - Example:
 *      ```
 *      providers: [
 *        provideZonelessChangeDetection(),
 *        ...otherProviders
 *      ]
 *      ```
 *
 * 4. COMMON PATTERNS:
 *
 *    Pattern A: Testing standalone component directly
 *    ```typescript
 *    beforeEach(() => {
 *      TestBed.configureTestingModule({
 *        imports: [MyStandaloneComponent],
 *        providers: [provideZonelessChangeDetection()]
 *      });
 *    });
 *    fixture = TestBed.createComponent(MyStandaloneComponent);
 *    ```
 *
 *    Pattern B: Testing standalone component with test wrapper
 *    ```typescript
 *    @Component({
 *      standalone: false,
 *      template: `<app-my-component [input]="data"></app-my-component>`
 *    })
 *    class TestHostComponent {
 *      @Input() data: any;
 *    }
 *
 *    beforeEach(() => {
 *      TestBed.configureTestingModule({
 *        declarations: [TestHostComponent],
 *        imports: [MyStandaloneComponent],
 *        providers: [provideZonelessChangeDetection()]
 *      });
 *    });
 *    fixture = TestBed.createComponent(TestHostComponent);
 *    ```
 *
 *    Pattern C: Testing standalone pipe
 *    ```typescript
 *    beforeEach(() => {
 *      TestBed.configureTestingModule({
 *        imports: [MyStandalonePipe],
 *        providers: [provideZonelessChangeDetection()]
 *      });
 *    });
 *    ```
 *
 * 5. ANTI-PATTERNS TO AVOID:
 *    - Don't put standalone components in declarations (error!)
 *    - Don't put standalone pipes in declarations (error!)
 *    - Don't put non-standalone components in imports
 *    - Don't forget provideZonelessChangeDetection() in zoneless setup
 *
 * 6. DEBUGGING ISSUES:
 *    - "Unknown selector" error → Component not in imports
 *    - "Standalone component not in imports" → Move to imports
 *    - "Cannot match any routes" → Add RouterTestingModule to imports
 *    - Change detection not working → Ensure provideZonelessChangeDetection()
 */
export const STANDALONE_TEST_GUIDELINES = `
Angular 20 Zoneless Standalone Components Testing Guidelines
=============================================================

Rule 1: STANDALONE COMPONENTS/PIPES/DIRECTIVES
- Always use imports array in TestBed.configureTestingModule()
- Never use declarations array for standalone items
- All dependencies must also be standalone or imported

Rule 2: NON-STANDALONE TEST WRAPPERS
- Create with standalone: false
- Place in declarations array
- Used to test standalone components with custom setup
- Can provide template, inputs, outputs for testing

Rule 3: REQUIRED PROVIDER
- provideZonelessChangeDetection() must be in providers array
- This is required for Angular 20 zoneless change detection
- Import from @angular/core

Rule 4: COMMON ERRORS
Error: "Can't resolve component/pipe in module"
Solution: Add to imports, not declarations

Error: "Unknown selector 'app-my-component'"
Solution: Component is not imported in TestBed

Error: Change detection not triggering
Solution: Missing provideZonelessChangeDetection() provider

Rule 5: TESTING STANDALONE COMPONENTS
1. Import the component into TestBed
2. Create fixture of the component directly
3. Use @Input/@Output to test properties
4. Or wrap in non-standalone host for complex scenarios

Rule 6: TESTING STANDALONE PIPES
1. Import the pipe into TestBed
2. Create fixture of a component that uses the pipe
3. Use in template or test through component instance
4. Verify pipe transform output

Rule 7: TESTING STANDALONE DIRECTIVES
1. Import the directive into TestBed
2. Create host component in declarations (non-standalone)
3. Apply directive in host template
4. Test directive effects on host element
`;
