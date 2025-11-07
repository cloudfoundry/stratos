import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {  Component, provideZonelessChangeDetection, inject } from '@angular/core';
import { TailwindDialogService, TailwindDialogRef, MAT_DIALOG_DATA } from './tailwind-dialog.service';
import { ApplicationRef, Injector, EnvironmentInjector } from '@angular/core';

// Test component to be used in dialogs
@Component({
  selector: 'test-dialog-component',
  template: '<div class="test-dialog">Test Dialog Content</div>',
  standalone: true
})
class TestDialogComponent {
  public dialogRef = inject(TailwindDialogRef<TestDialogComponent>);
  public data = inject(MAT_DIALOG_DATA, { optional: true });
}

// Test component with data injection
@Component({
  selector: 'test-dialog-with-data',
  template: '<div>{{ data.message }}</div>',
  standalone: true
})
class TestDialogWithDataComponent {
  public dialogRef = inject(TailwindDialogRef<TestDialogWithDataComponent>);
  public data = inject(MAT_DIALOG_DATA);
}

describe('TailwindDialogService', () => {
  let service: TailwindDialogService;
  let appRef: ApplicationRef;
  let injector: Injector;
  let environmentInjector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        TailwindDialogService
      ,
        provideZonelessChangeDetection()
      ]
    });

    service = TestBed.inject(TailwindDialogService);
  });

  afterEach(() => {
    // Clean up any open dialogs
    if (service) {
      service.closeAll();
    }
    // Remove any remaining dialog elements (check if document exists first)
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[class*="fixed inset-0"]').forEach(el => el.remove());
    }
  });

  describe('Basic Dialog Opening', () => {
    it('should open a dialog', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef).toBeTruthy();
      expect(dialogRef.componentInstance).toBeInstanceOf(TestDialogComponent);

      // Check if dialog is in DOM
      const dialogElement = document.querySelector('.fixed.inset-0');
      expect(dialogElement).toBeTruthy();

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300); // Wait for close animation
      vi.useRealTimers();
    });

    it('should emit afterOpened event', async () => {
      vi.useFakeTimers();
      let opened = false;
      const dialogRef = service.open(TestDialogComponent);

      dialogRef.afterOpened().subscribe(() => {
        opened = true;
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(opened).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should create dialog with correct DOM structure', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

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
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });

  describe('Dialog Closing', () => {
    it('should close on backdrop click when disableClose is false', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { disableClose: false });
      await vi.advanceTimersByTimeAsync(0);

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

      await vi.advanceTimersByTimeAsync(300);
      expect(closed).toBe(true);
      vi.useRealTimers();
    });

    it('should close on ESC key when disableClose is false', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { disableClose: false });
      await vi.advanceTimersByTimeAsync(0);

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Press ESC key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      await vi.advanceTimersByTimeAsync(300);
      expect(closed).toBe(true);
      vi.useRealTimers();
    });

    it('should NOT close on backdrop click when disableClose is true', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { disableClose: true });
      await vi.advanceTimersByTimeAsync(0);

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Click on backdrop
      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: backdrop, enumerable: true });
      backdrop.dispatchEvent(clickEvent);

      await vi.advanceTimersByTimeAsync(300);
      expect(closed).toBe(false);

      // Manually close for cleanup
      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should NOT close on ESC key when disableClose is true', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { disableClose: true });
      await vi.advanceTimersByTimeAsync(0);

      let closed = false;
      dialogRef.afterClosed().subscribe(() => {
        closed = true;
      });

      // Press ESC key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      await vi.advanceTimersByTimeAsync(300);
      expect(closed).toBe(false);

      // Manually close for cleanup
      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should close programmatically via dialogRef.close()', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      let closed = false;
      let result: any;
      dialogRef.afterClosed().subscribe((res) => {
        closed = true;
        result = res;
      });

      dialogRef.close('test-result');
      await vi.advanceTimersByTimeAsync(300);

      expect(closed).toBe(true);
      expect(result).toBe('test-result');
      vi.useRealTimers();
    });

    it('should remove dialog from DOM after closing', async () => {
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      expect(document.querySelector('.fixed.inset-0')).toBeTruthy();

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300); // Wait for animation
      await vi.runAllTimersAsync(); // Ensure all timers complete

      expect(document.querySelector('.fixed.inset-0')).toBeFalsy();
      vi.useRealTimers();
    });
  });

  describe('Dialog Configuration', () => {
    it('should apply custom width', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { width: '500px' });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.width).toBe('500px');

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should apply custom height', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { height: '400px' });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.height).toBe('400px');

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should apply custom maxWidth', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { maxWidth: '800px' });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.maxWidth).toBe('800px');

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should apply custom maxHeight', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { maxHeight: '600px' });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.style.maxHeight).toBe('600px');

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should apply custom panelClass', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { panelClass: 'custom-dialog-class' });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.classList.contains('custom-dialog-class')).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should apply multiple custom panelClasses', async () => {
      const dialogRef = service.open(TestDialogComponent, {
        panelClass: ['custom-class-1', 'custom-class-2']
      });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.classList.contains('custom-class-1')).toBe(true);
      expect(panel.classList.contains('custom-class-2')).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
    });

    it('should apply custom backdropClass', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, { backdropClass: 'custom-backdrop' });
      await vi.advanceTimersByTimeAsync(0);

      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      expect(backdrop.classList.contains('custom-backdrop')).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });

  describe('Data Injection', () => {
    it('should inject data into dialog component', async () => {

      vi.useFakeTimers();
      const testData = { message: 'Test Message', value: 42 };
      const dialogRef = service.open(TestDialogWithDataComponent, { data: testData });
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef.componentInstance.data).toEqual(testData);
      expect(dialogRef.componentInstance.data.message).toBe('Test Message');
      expect(dialogRef.componentInstance.data.value).toBe(42);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should inject empty object when no data provided', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogWithDataComponent);
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef.componentInstance.data).toEqual({});

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });

  describe('DialogRef Methods', () => {
    it('should have working afterClosed observable', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      let closed = false;
      let result: any;

      dialogRef.afterClosed().subscribe((res) => {
        closed = true;
        result = res;
      vi.useRealTimers();
      });

      expect(closed).toBe(false);

      dialogRef.close('result-value');
      await vi.advanceTimersByTimeAsync(300);

      expect(closed).toBe(true);
      expect(result).toBe('result-value');
    });

    it('should have working afterOpened observable', async () => {
      let opened = false;

      const dialogRef = service.open(TestDialogComponent);
      dialogRef.afterOpened().subscribe(() => {
        opened = true;
      });

      await vi.advanceTimersByTimeAsync(0);

      expect(opened).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
    });

    it('should provide componentInstance reference', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef.componentInstance).toBeInstanceOf(TestDialogComponent);
      expect(dialogRef.componentInstance.dialogRef).toBe(dialogRef);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });

  describe('Multiple Dialogs', () => {
    it('should support opening multiple dialogs', async () => {

      vi.useFakeTimers();
      const dialogRef1 = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const dialogRef2 = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const dialogs = document.querySelectorAll('.fixed.inset-0');
      expect(dialogs.length).toBe(2);

      dialogRef1.close();
      await vi.advanceTimersByTimeAsync(300);

      dialogRef2.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should close all dialogs with closeAll()', async () => {

      vi.useFakeTimers();
      service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);
      service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);
      service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      expect(document.querySelectorAll('.fixed.inset-0').length).toBe(3);

      service.closeAll();
      await vi.advanceTimersByTimeAsync(300);
      await vi.runAllTimersAsync();

      // Note: closeAll() removes immediately without animation
      expect(document.querySelectorAll('.fixed.inset-0').length).toBe(0);
      vi.useRealTimers();
    });

    it('should maintain proper z-index stacking for multiple dialogs', async () => {

      vi.useFakeTimers();
      const dialogRef1 = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const dialogRef2 = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const dialogs = document.querySelectorAll('.fixed.inset-0');
      expect(dialogs.length).toBe(2);

      // All dialogs should have z-50 class
      dialogs.forEach(dialog => {
        expect(dialog.classList.contains('z-50')).toBe(true);
      vi.useRealTimers();
      });

      dialogRef1.close();
      await vi.advanceTimersByTimeAsync(300);
      dialogRef2.close();
      await vi.advanceTimersByTimeAsync(300);
    });
  });

  describe('Animations', () => {
    it('should have fade-in animation class on backdrop', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop.classList.contains('animate-fade-in')).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should have scale-in animation class on panel', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg');
      expect(panel.classList.contains('animate-scale-in')).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should apply fade-out transition on close', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(10); // Small tick to trigger close animation

      expect(backdrop.style.transition).toContain('opacity');
      expect(backdrop.style.opacity).toBe('0');

      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close operations', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);
      dialogRef.close();

      const dialogRef2 = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);
      dialogRef2.close();

      await vi.advanceTimersByTimeAsync(300);
      await vi.runAllTimersAsync();

      expect(document.querySelectorAll('.fixed.inset-0').length).toBe(0);
      vi.useRealTimers();
    });

    it('should handle close being called multiple times', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      let closeCount = 0;
      dialogRef.afterClosed().subscribe(() => {
        closeCount++;
      vi.useRealTimers();
      });

      dialogRef.close();
      dialogRef.close();
      dialogRef.close();

      await vi.advanceTimersByTimeAsync(300);

      expect(closeCount).toBe(1); // Should only emit once
    });

    it('should handle dialog with no configuration', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef).toBeTruthy();
      expect(document.querySelector('.fixed.inset-0')).toBeTruthy();

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });
});
