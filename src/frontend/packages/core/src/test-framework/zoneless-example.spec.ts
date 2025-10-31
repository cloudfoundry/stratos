import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  detectChanges,
  waitForAsync,
  waitForCondition,
  getElement,
  getAllElements,
  clickElement,
  setInputValue,
  flushMicrotasks
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
        <span class="validation-error" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
          Name is required
        </span>
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
    name: new FormControl('', [Validators.required])
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
        // CRITICAL: Must include zoneless provider in every test
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;

    // Initial change detection
    detectChanges(fixture);
  });

  /**
   * PATTERN 1: Basic Property Testing
   */
  describe('Basic Property Testing', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should display initial title', () => {
      const h1 = getElement(fixture, 'h1');
      expect(h1?.textContent).toBe('Example Component');
    });

    it('should update title when changed', () => {
      // Change property
      component.title = 'Updated Title';

      // CRITICAL: Must trigger change detection manually
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
      const counter = getElement(fixture, '.counter');
      expect(counter?.textContent).toContain('Count: 0');
    });

    it('should update count signal', () => {
      // Update signal
      component.count.set(5);

      // Signals trigger change detection automatically in zoneless mode
      // But we still call detectChanges for consistency
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
      detectChanges(fixture);

      // Check loading indicator
      const status = getElement(fixture, '.status');
      expect(status?.classList.contains('loading')).toBe(true);
      expect(status?.textContent).toContain('Loading...');
    });

    it('should load data asynchronously', async () => {
      // Start async operation
      const promise = component.loadData();

      // Initially should be loading
      detectChanges(fixture);
      expect(component.loading).toBe(true);

      // Wait for completion
      await promise;

      // Trigger change detection after async completes
      detectChanges(fixture);

      // Verify final state
      expect(component.loading).toBe(false);
      expect(component.data).toBe('Loaded Data');

      const dataSpan = getElement(fixture, '.data');
      expect(dataSpan?.textContent).toBe('Loaded Data');
    });

    it('should wait for loading to complete using waitForCondition', async () => {
      // Start async operation (don't await it)
      component.loadData();

      // Wait for loading to finish
      await waitForCondition(
        fixture,
        () => component.loading === false,
        2000
      );

      // Verify data loaded
      expect(component.data).toBe('Loaded Data');
      const dataSpan = getElement(fixture, '.data');
      expect(dataSpan?.textContent).toBe('Loaded Data');
    });
  });

  /**
   * PATTERN 5: Form Testing
   */
  describe('Form Testing', () => {
    it('should have empty initial form', () => {
      expect(component.form.value.name).toBe('');
    });

    it('should be invalid when empty', () => {
      expect(component.form.valid).toBe(false);
      expect(component.form.get('name')?.hasError('required')).toBe(true);
    });

    it('should update form value on input', async () => {
      const input = getElement(fixture, '.name-input') as HTMLInputElement;

      // Set input value with helper
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
      const items = getAllElements(fixture, '.item');
      expect(items.length).toBe(0);
    });

    it('should add items to list', () => {
      // Add items
      component.addItem('Item 1');
      component.addItem('Item 2');
      component.addItem('Item 3');

      // Trigger change detection
      detectChanges(fixture);

      // Verify items rendered
      const items = getAllElements(fixture, '.item');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('Item 1');
      expect(items[1].textContent).toBe('Item 2');
      expect(items[2].textContent).toBe('Item 3');
    });
  });

  /**
   * PATTERN 7: Combined Scenarios
   */
  describe('Combined Scenarios', () => {
    it('should handle multiple state updates', async () => {
      // Update multiple properties
      component.title = 'New Title';
      component.count.set(10);
      component.addItem('Test Item');

      // Single change detection for efficiency
      detectChanges(fixture);

      // Verify all updates
      expect(getElement(fixture, 'h1')?.textContent).toBe('New Title');
      expect(getElement(fixture, '.counter')?.textContent).toContain('Count: 10');
      expect(getAllElements(fixture, '.item').length).toBe(1);
    });

    it('should handle async and sync updates together', async () => {
      // Sync update
      component.title = 'Loading Data';
      detectChanges(fixture);

      // Async update
      await component.loadData();
      detectChanges(fixture);

      // Sync update after async
      component.title = 'Data Loaded';
      detectChanges(fixture);

      // Verify final state
      expect(component.title).toBe('Data Loaded');
      expect(component.data).toBe('Loaded Data');
      expect(component.loading).toBe(false);
    });
  });

  /**
   * PATTERN 8: Using waitForAsync Helper
   */
  describe('waitForAsync Helper', () => {
    it('should use waitForAsync for promise-based operations', async () => {
      await waitForAsync(fixture, async () => {
        await component.loadData();
      });

      // Change detection already triggered by helper
      expect(component.data).toBe('Loaded Data');
      expect(component.loading).toBe(false);
    });
  });

  /**
   * PATTERN 9: Using flushMicrotasks
   */
  describe('flushMicrotasks Helper', () => {
    it('should flush all pending promises', async () => {
      // Start multiple async operations
      component.loadData();
      Promise.resolve().then(() => {
        component.addItem('Async Item');
      });

      // Flush all microtasks
      await flushMicrotasks(fixture);

      // All async operations should be complete
      expect(component.data).toBe('Loaded Data');
      expect(component.items.length).toBe(1);
    });
  });
});

/**
 * Example: Service Testing in Zoneless Mode
 */
describe('Service Testing Example', () => {
  it('should demonstrate service testing pattern', async () => {
    // Services work the same way, just need zoneless provider
    const service = TestBed.inject(ExampleComponent);
    expect(service).toBeDefined();
  });
});
