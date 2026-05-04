import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {  Component, provideZonelessChangeDetection, inject } from '@angular/core';
import { TailwindDialogService, TailwindDialogRef, MAT_DIALOG_DATA } from './tailwind-dialog.service';
import { ApplicationRef, Injector, EnvironmentInjector } from '@angular/core';

// Test component to be used in dialogs
@Component({
  selector: 'test-dialog-component',
  template: '<div class="test-dialog">Test Dialog Content</div>',
  standalone: true,
})
class TestDialogComponent {
  public dialogRef = inject(TailwindDialogRef<TestDialogComponent>);
  public data = inject(MAT_DIALOG_DATA, { optional: true });
}

// Test component with data injection
@Component({
  selector: 'test-dialog-with-data',
  template: '<div>{{ data.message }}</div>',
  standalone: true,
})
class TestDialogWithDataComponent {
  public dialogRef = inject(TailwindDialogRef<TestDialogWithDataComponent>);
  public data = inject(MAT_DIALOG_DATA);
}

describe('TailwindDialogService', () => {
  let service: TailwindDialogService;
  let _appRef: ApplicationRef;
  let _injector: Injector;
  let _environmentInjector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        TailwindDialogService,
        provideZonelessChangeDetection(),
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
      await vi.runAllTimersAsync(); // Run all pending timers including requestAnimationFrame

      // Check backdrop - uses inline styles for opacity, not bg-opacity class
      const backdrop = document.querySelector('.fixed.inset-0.bg-black') as HTMLElement;
      expect(backdrop).toBeTruthy();

      // Check dialog panel
      const panel = document.querySelector('.bg-content-bg.rounded-lg.shadow-xl');
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
      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent, {
        panelClass: ['custom-class-1', 'custom-class-2']
      });
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel.classList.contains('custom-class-1')).toBe(true);
      expect(panel.classList.contains('custom-class-2')).toBe(true);

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
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
      });

      expect(closed).toBe(false);

      dialogRef.close('result-value');
      await vi.advanceTimersByTimeAsync(300);

      expect(closed).toBe(true);
      expect(result).toBe('result-value');
      vi.useRealTimers();
    });

    it('should have working afterOpened observable', async () => {
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

      const dialogs = document.querySelectorAll('.fixed.inset-0') as NodeListOf<HTMLElement>;
      expect(dialogs.length).toBe(2);

      // Check that dialogs have proper z-index stacking (uses inline styles, not classes)
      // First dialog should have z-index 1000, second should have 1010
      expect(parseInt(dialogs[0].style.zIndex)).toBe(1000);
      expect(parseInt(dialogs[1].style.zIndex)).toBe(1010);

      dialogRef1.close();
      await vi.advanceTimersByTimeAsync(300);
      dialogRef2.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });
  });

  describe('Animations', () => {
    it('should have fade-in animation on backdrop', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);

      // Check initial state (before animation)
      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      expect(backdrop).toBeTruthy();

      // The service uses inline styles for animation, not classes
      // It should have transition-opacity class and start transparent
      expect(backdrop.classList.contains('transition-opacity')).toBe(true);
      expect(backdrop.style.backgroundColor).toBe('rgba(0, 0, 0, 0)');

      // After requestAnimationFrame, it should fade in
      await vi.runAllTimersAsync();
      expect(backdrop.style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');

      dialogRef.close();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    });

    it('should have fade-in animation on panel', async () => {

      vi.useFakeTimers();
      const dialogRef = service.open(TestDialogComponent);
      await vi.advanceTimersByTimeAsync(0);

      const panel = document.querySelector('.rounded-lg') as HTMLElement;
      expect(panel).toBeTruthy();

      // Opacity-only animation. The previous implementation used `transform`
      // + `scale-95` for a scale-in entrance, but those classes made the
      // panel a containing block for any position:fixed descendant — which
      // broke CustomSelect dropdown anchoring inside the dialog. Animation
      // is now opacity-only; the rounded-lg panel starts hidden and fades
      // in via inline opacity transitions.
      expect(panel.classList.contains('transition-opacity')).toBe(true);
      expect(panel.classList.contains('opacity-0')).toBe(true);

      // After requestAnimationFrame, it should fade in to full opacity.
      // No transform style is set — keeping transform === 'none' is what
      // preserves the position:fixed viewport-coordinate math.
      await vi.runAllTimersAsync();
      expect(panel.style.opacity).toBe('1');
      expect(panel.style.transform).toBe('');

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

      // The service uses background-color transition for fade-out (line 459 in service)
      expect(backdrop.style.transition).toContain('background-color');
      expect(backdrop.style.backgroundColor).toBe('rgba(0, 0, 0, 0)');

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
      });

      dialogRef.close();
      dialogRef.close();
      dialogRef.close();

      await vi.advanceTimersByTimeAsync(300);

      expect(closeCount).toBe(1); // Should only emit once
      vi.useRealTimers();
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
