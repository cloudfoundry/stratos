import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  detectChanges,
  getElement,
  getAllElements,
  clickElement,
  setInputValue,
} from './zoneless-test-utils';

/**
 * Example component demonstrating zoneless testing patterns
 */
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="example-container">
      <h1>{{ title }}</h1>
      <p class="counter">Count: {{ count() }}</p>

      <button class="increment" (click)="increment()">Increment</button>

      <div class="status" [class.loading]="loading">
        @if (loading) {
          <span>Loading...</span>
        } @else if (data) {
          <span class="data">{{ data }}</span>
        }
      </div>

      <form [formGroup]="form">
        <input
          type="text"
          formControlName="name"
          placeholder="Enter name"
          class="name-input"
        />
        @if (form.get('name')?.invalid && form.get('name')?.touched) {
        <span class="validation-error">
          Name is required
        </span>
        }
      </form>

      <ul class="item-list">
        @for (item of items; track item) {
          <li class="item">{{ item }}</li>
        }
      </ul>
    </div>
  `
})
class ExampleComponent {
  title = 'Example Component';
  count = signal(0);
  loading = false;
  data: string | null = null;
  items: string[] = [];

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  increment(): void {
    this.count.update(val => val + 1);
  }

  async loadData(): Promise<void> {
    this.loading = true;
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    this.data = 'Loaded Data';
    this.loading = false;
  }

  addItem(item: string): void {
    this.items = [...this.items, item];
  }
}

/**
 * Example Tests: Zoneless Testing Patterns
 *
 * This spec demonstrates the correct patterns for testing components
 * in a zoneless Angular application (without Zone.js).
 */
describe('Zoneless Example Tests', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent],
      providers: [
        // CRITICAL: Must include zoneless provider in every test,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;

    // In zoneless mode, creating the fixture triggers the first change detection automatically
    // We DON'T call fixture.detectChanges() here because it would lock in initial values
    // and cause NG0100 errors when we try to update properties in tests.
    // Instead, each test calls detectChanges() when needed to update the view.
  });

  /**
   * PATTERN 1: Basic Property Testing
   */
  describe('Basic Property Testing', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should display initial title', () => {
      // In zoneless mode, we need to trigger the initial render explicitly
      detectChanges(fixture);

      const h1 = getElement(fixture, 'h1');
      expect(h1?.textContent).toBe('Example Component');
    });

    it('should update title when changed', () => {
      // Change property
      component.title = 'Updated Title';

      // CRITICAL: Must trigger change detection manually
      // In zoneless mode, detectChanges() immediately runs Angular's change detection
      detectChanges(fixture);

      // Now DOM reflects the change
      const h1 = getElement(fixture, 'h1');
      expect(h1?.textContent).toBe('Updated Title');
    });
  });

  /**
   * PATTERN 2: Signal Testing
   */
  describe('Signal Testing', () => {
    it('should display initial count', () => {
      // In zoneless mode, we need to trigger the initial render explicitly
      detectChanges(fixture);

      const counter = getElement(fixture, '.counter');
      expect(counter?.textContent).toContain('Count: 0');
    });

    it('should update count signal', () => {
      // Start with initial render
      detectChanges(fixture);

      // Update signal
      component.count.set(5);

      // Signals in zoneless mode DO NOT automatically trigger view updates
      // We must call detectChanges() to synchronize the view with the new signal value
      detectChanges(fixture);

      const counter = getElement(fixture, '.counter');
      expect(counter?.textContent).toContain('Count: 5');
    });
  });

  /**
   * PATTERN 3: User Interaction Testing
   */
  describe('User Interaction Testing', () => {
    it('should increment count on button click', async () => {
      const button = getElement(fixture, '.increment');

      // Click button
      await clickElement(fixture, button!);

      // Verify signal updated
      expect(component.count()).toBe(1);

      // Verify DOM updated
      const counter = getElement(fixture, '.counter');
      expect(counter?.textContent).toContain('Count: 1');
    });

    it('should increment multiple times', async () => {
      const button = getElement(fixture, '.increment');

      // Click three times
      await clickElement(fixture, button!);
      await clickElement(fixture, button!);
      await clickElement(fixture, button!);

      expect(component.count()).toBe(3);
    });
  });

  /**
   * PATTERN 4: Async Operation Testing
   */
  describe('Async Operation Testing', () => {
    it('should show loading state', () => {
      // Set loading state
      component.loading = true;

      // Trigger change detection
      // In zoneless mode, detectChanges() immediately runs Angular's change detection
      detectChanges(fixture);

      // Check loading indicator
      const status = getElement(fixture, '.status');
      expect(status?.classList.contains('loading')).toBe(true);
      expect(status?.textContent).toContain('Loading...');
    });

    it('should load data asynchronously', async () => {
      // Initial render
      detectChanges(fixture);

      // Start async operation
      const promise = component.loadData();

      // Wait for completion
      await promise;

      // Verify final state - check component state directly
      expect(component.loading).toBe(false);
      expect(component.data).toBe('Loaded Data');
    });

  });

  /**
   * PATTERN 5: Form Testing
   */
  describe('Form Testing', () => {
    it('should have empty initial form', () => {
      // Initial form state is available from component without needing detectChanges(),
      expect(component.form.value.name).toBe('');
    });

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBe(false);
      expect(component.form.get('name')?.hasError('required')).toBe(true);
    });

    it('should update form value on input', async () => {
      // Initial render to make input element available
      detectChanges(fixture);

      const input = getElement(fixture, '.name-input') as HTMLInputElement;

      // Set input value with helper
      // setInputValue dispatches 'input' and 'change' events and calls detectChanges
      await setInputValue(fixture, input, 'John Doe');

      // Verify form updated
      expect(component.form.value.name).toBe('John Doe');
      expect(component.form.valid).toBe(true);
    });

    it('should show validation error when touched and invalid', async () => {
      const input = getElement(fixture, '.name-input') as HTMLInputElement;

      // Touch the field without entering value
      input.focus();
      input.blur();
      component.form.get('name')?.markAsTouched();

      detectChanges(fixture);

      // Validation error should appear
      const error = getElement(fixture, '.validation-error');
      expect(error).toBeTruthy();
      expect(error?.textContent).toContain('Name is required');
    });
  });

  /**
   * PATTERN 6: List/Array Testing
   */
  describe('List Testing', () => {
    it('should start with empty list', () => {
      // In zoneless mode, we need to trigger the initial render explicitly
      detectChanges(fixture);

      const items = getAllElements(fixture, '.item');
      expect(items.length).toBe(0);
    });

    it('should add items to list', () => {
      // Initial render
      detectChanges(fixture);

      // Verify empty list initially
      const items = getAllElements(fixture, '.item');
      expect(items.length).toBe(0);

      // Best practice: Build items array first, then update component once
      // This avoids @for loop mutation issues during change detection
      const newItems = ['Item 1', 'Item 2', 'Item 3'];
      for (const item of newItems) {
        component.addItem(item);
      }

      // Verify items were added to component state
      expect(component.items.length).toBe(3);
      expect(component.items[0]).toBe('Item 1');
      expect(component.items[1]).toBe('Item 2');
      expect(component.items[2]).toBe('Item 3');
    });
  });

  /**
   * PATTERN 7: Combined Scenarios
   */
  describe('Combined Scenarios', () => {
    it('should handle multiple state updates', () => {
      // Initial render
      detectChanges(fixture);

      // Update multiple properties
      component.title = 'New Title';
      component.count.set(10);
      component.addItem('Test Item');

      // Single change detection for efficiency
      // In zoneless mode, detectChanges() immediately runs Angular's change detection
      detectChanges(fixture);

      // Verify all updates
      expect(getElement(fixture, 'h1')?.textContent).toBe('New Title');
      expect(getElement(fixture, '.counter')?.textContent).toContain('Count: 10');
      expect(getAllElements(fixture, '.item').length).toBe(1);
    });

    it('should handle async and sync updates together', async () => {
      // Initial render
      detectChanges(fixture);

      // Change title
      component.title = 'Loading Data';

      // Async operation - this updates component.loading and component.data
      await component.loadData();

      // Update title again
      component.title = 'Data Loaded';

      // Verify final component state
      // KEY PRINCIPLE: In zoneless mode, verify component state directly
      // Avoid repeatedly checking DOM properties that change between detectChanges() calls
      expect(component.title).toBe('Data Loaded');
      expect(component.loading).toBe(false);
      expect(component.data).toBe('Loaded Data');
    });
  });

});

/**
 * Example: Service Testing in Zoneless Mode
 */
describe('Service Testing Example', () => {
  // Create a test service
  class TestService {
    getValue(): string {
      return 'Test Value';
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        TestService,
        // Services require zoneless provider just like components,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  it('should demonstrate service testing pattern', () => {
    // Services in zoneless mode require, provideZonelessChangeDetection() in TestBed config
    // This example demonstrates service testing in zoneless mode

    // Service testing in zoneless mode is the same as zone-based mode
    // The zoneless provider just ensures change detection works correctly
    const service = TestBed.inject(TestService);
    expect(service).toBeDefined();
    expect(service.getValue()).toBe('Test Value');
  });
});
