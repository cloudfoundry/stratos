import { TestBed, ComponentFixture, fakeAsync, tick, flush } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Component } from '@angular/core';
import { TailwindDialogService, TailwindDialogRef, MAT_DIALOG_DATA } from './tailwind-dialog.service';
import { ApplicationRef, Injector, EnvironmentInjector } from '@angular/core';

// Test component to be used in dialogs
@Component({
  selector: 'test-dialog-component',
  template: '<div class="test-dialog">Test Dialog Content</div>',
  standalone: true
})
class TestDialogComponent {
  constructor(
    public dialogRef: TailwindDialogRef<TestDialogComponent>,
    public data?: any
  ) {}
}

// Test component with data injection
@Component({
  selector: 'test-dialog-with-data',
  template: '<div>{{ data.message }}</div>',
  standalone: true
})
class TestDialogWithDataComponent {
  constructor(
    public dialogRef: TailwindDialogRef<TestDialogWithDataComponent>,
    public data: any
  ) {}
}

describe('TailwindDialogService', () => {
  let service: TailwindDialogService;
  let appRef: ApplicationRef;
  let injector: Injector;
  let environmentInjector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TailwindDialogService,
        ApplicationRef,
        Injector,
        EnvironmentInjector
      ]
    });

    service = TestBed.inject(TailwindDialogService);
    appRef = TestBed.inject(ApplicationRef);
    injector = TestBed.inject(Injector);
    environmentInjector = TestBed.inject(EnvironmentInjector);
  });

  afterEach(() => {
    // Clean up any open dialogs
    service.closeAll();
    // Remove any remaining dialog elements
    document.querySelectorAll('[class*="fixed inset-0"]').forEach(el => el.remove());
  });

  describe('Basic Dialog Opening', () => {
    it('should open a dialog', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      expect(dialogRef).toBeTruthy();
      expect(dialogRef.componentInstance).toBeInstanceOf(TestDialogComponent);

      // Check if dialog is in DOM
      const dialogElement = document.querySelector('.fixed.inset-0');
      expect(dialogElement).toBeTruthy();

      dialogRef.close();
      tick(300); // Wait for close animation
    }));

    it('should emit afterOpened event', fakeAsync(() => {
      let opened = false;
      const dialogRef = service.open(TestDialogComponent);

      dialogRef.afterOpened().subscribe(() => {
        opened = true;
      });

      tick();
      expect(opened).toBe(true);

      dialogRef.close();
      tick(300);
    }));

    it('should create dialog with correct DOM structure', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      // Check backdrop
      const backdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(backdrop).toBeTruthy();

      // Check dialog panel
      const panel = document.querySelector('.bg-white.rounded-lg.shadow-xl');
      expect(panel).toBeTruthy();

      // Check content container
      const content = document.querySelector('.dialog-content');
      expect(content).toBeTruthy();

      dialogRef.close();
      tick(300);
    }));
  });

  describe('Dialog Closing', () => {
    it('should close on backdrop click when disableClose is false', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { disableClose: false });
      tick();

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Click on backdrop
      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      expect(backdrop).toBeTruthy();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: backdrop, enumerable: true });
      backdrop.dispatchEvent(clickEvent);

      tick(300);
      expect(closed).toBe(true);
    }));

    it('should close on ESC key when disableClose is false', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { disableClose: false });
      tick();

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Press ESC key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      tick(300);
      expect(closed).toBe(true);
    }));

    it('should NOT close on backdrop click when disableClose is true', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { disableClose: true });
      tick();

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Click on backdrop
      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: backdrop, enumerable: true });
      backdrop.dispatchEvent(clickEvent);

      tick(300);
      expect(closed).toBe(false);

      // Manually close for cleanup
      dialogRef.close();
      tick(300);
    }));

    it('should NOT close on ESC key when disableClose is true', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { disableClose: true });
      tick();

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Press ESC key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      tick(300);
      expect(closed).toBe(false);

      // Manually close for cleanup
      dialogRef.close();
      tick(300);
    }));

    it('should close programmatically via dialogRef.close()', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      let closed = false;
      let result: any;
      dialogRef.afterClosed().subscribe((res) => {
        closed = true;
        result = res;
      });

      dialogRef.close('test-result');
      tick(300);

      expect(closed).toBe(true);
      expect(result).toBe('test-result');
    }));

    it('should remove dialog from DOM after closing', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      expect(document.querySelector('.fixed.inset-0')).toBeTruthy();

      dialogRef.close();
      tick(300); // Wait for animation
      flush(); // Ensure all timers complete

      expect(document.querySelector('.fixed.inset-0')).toBeFalsy();
    }));
  });

  describe('Dialog Configuration', () => {
    it('should apply custom width', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { width: '500px' });
      tick();

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.width).toBe('500px');

      dialogRef.close();
      tick(300);
    }));

    it('should apply custom height', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { height: '400px' });
      tick();

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.height).toBe('400px');

      dialogRef.close();
      tick(300);
    }));

    it('should apply custom maxWidth', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { maxWidth: '800px' });
      tick();

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.maxWidth).toBe('800px');

      dialogRef.close();
      tick(300);
    }));

    it('should apply custom maxHeight', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { maxHeight: '600px' });
      tick();

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.maxHeight).toBe('600px');

      dialogRef.close();
      tick(300);
    }));

    it('should apply custom panelClass', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { panelClass: 'custom-dialog-class' });
      tick();

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.classList.contains('custom-dialog-class')).toBe(true);

      dialogRef.close();
      tick(300);
    }));

    it('should apply multiple custom panelClasses', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, {
        panelClass: ['custom-class-1', 'custom-class-2']
      });
      tick();

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.classList.contains('custom-class-1')).toBe(true);
      expect(panel.classList.contains('custom-class-2')).toBe(true);

      dialogRef.close();
      tick(300);
    }));

    it('should apply custom backdropClass', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent, { backdropClass: 'custom-backdrop' });
      tick();

      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      expect(backdrop.classList.contains('custom-backdrop')).toBe(true);

      dialogRef.close();
      tick(300);
    }));
  });

  describe('Data Injection', () => {
    it('should inject data into dialog component', fakeAsync(() => {
      const testData = { message: 'Test Message', value: 42 };
      const dialogRef = service.open(TestDialogWithDataComponent, { data: testData });
      tick();

      expect(dialogRef.componentInstance.data).toEqual(testData);
      expect(dialogRef.componentInstance.data.message).toBe('Test Message');
      expect(dialogRef.componentInstance.data.value).toBe(42);

      dialogRef.close();
      tick(300);
    }));

    it('should inject empty object when no data provided', fakeAsync(() => {
      const dialogRef = service.open(TestDialogWithDataComponent);
      tick();

      expect(dialogRef.componentInstance.data).toEqual({});

      dialogRef.close();
      tick(300);
    }));
  });

  describe('DialogRef Methods', () => {
    it('should have working afterClosed observable', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      let closed = false;
      let result: any;

      dialogRef.afterClosed().subscribe((res) => {
        closed = true;
        result = res;
      });

      expect(closed).toBe(false);

      dialogRef.close('result-value');
      tick(300);

      expect(closed).toBe(true);
      expect(result).toBe('result-value');
    }));

    it('should have working afterOpened observable', fakeAsync(() => {
      let opened = false;

      const dialogRef = service.open(TestDialogComponent);
      dialogRef.afterOpened().subscribe(() => {
        opened = true;
      });

      tick();

      expect(opened).toBe(true);

      dialogRef.close();
      tick(300);
    }));

    it('should provide componentInstance reference', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      expect(dialogRef.componentInstance).toBeInstanceOf(TestDialogComponent);
      expect(dialogRef.componentInstance.dialogRef).toBe(dialogRef);

      dialogRef.close();
      tick(300);
    }));
  });

  describe('Multiple Dialogs', () => {
    it('should support opening multiple dialogs', fakeAsync(() => {
      const dialogRef1 = service.open(TestDialogComponent);
      tick();

      const dialogRef2 = service.open(TestDialogComponent);
      tick();

      const dialogs = document.querySelectorAll('.fixed.inset-0');
      expect(dialogs.length).toBe(2);

      dialogRef1.close();
      tick(300);

      dialogRef2.close();
      tick(300);
    }));

    it('should close all dialogs with closeAll()', fakeAsync(() => {
      service.open(TestDialogComponent);
      tick();
      service.open(TestDialogComponent);
      tick();
      service.open(TestDialogComponent);
      tick();

      expect(document.querySelectorAll('.fixed.inset-0').length).toBe(3);

      service.closeAll();
      tick(300);
      flush();

      // Note: closeAll() removes immediately without animation
      expect(document.querySelectorAll('.fixed.inset-0').length).toBe(0);
    }));

    it('should maintain proper z-index stacking for multiple dialogs', fakeAsync(() => {
      const dialogRef1 = service.open(TestDialogComponent);
      tick();

      const dialogRef2 = service.open(TestDialogComponent);
      tick();

      const dialogs = document.querySelectorAll('.fixed.inset-0');
      expect(dialogs.length).toBe(2);

      // All dialogs should have z-50 class
      dialogs.forEach(dialog => {
        expect(dialog.classList.contains('z-50')).toBe(true);
      });

      dialogRef1.close();
      tick(300);
      dialogRef2.close();
      tick(300);
    }));
  });

  describe('Animations', () => {
    it('should have fade-in animation class on backdrop', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop.classList.contains('animate-fade-in')).toBe(true);

      dialogRef.close();
      tick(300);
    }));

    it('should have scale-in animation class on panel', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      const panel = document.querySelector('.rounded-lg');
      expect(panel.classList.contains('animate-scale-in')).toBe(true);

      dialogRef.close();
      tick(300);
    }));

    it('should apply fade-out transition on close', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;

      dialogRef.close();
      tick(10); // Small tick to trigger close animation

      expect(backdrop.style.transition).toContain('opacity');
      expect(backdrop.style.opacity).toBe('0');

      tick(300);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close operations', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();
      dialogRef.close();

      const dialogRef2 = service.open(TestDialogComponent);
      tick();
      dialogRef2.close();

      tick(300);
      flush();

      expect(document.querySelectorAll('.fixed.inset-0').length).toBe(0);
    }));

    it('should handle close being called multiple times', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      let closeCount = 0;
      dialogRef.afterClosed().subscribe(() => {
        closeCount++;
      });

      dialogRef.close();
      dialogRef.close();
      dialogRef.close();

      tick(300);

      expect(closeCount).toBe(1); // Should only emit once
    }));

    it('should handle dialog with no configuration', fakeAsync(() => {
      const dialogRef = service.open(TestDialogComponent);
      tick();

      expect(dialogRef).toBeTruthy();
      expect(document.querySelector('.fixed.inset-0')).toBeTruthy();

      dialogRef.close();
      tick(300);
    }));
  });
});
