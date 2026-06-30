import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyToClipboardComponent } from './copy-to-clipboard.component';

describe('CopyToClipboardComponent', () => {
  let component: CopyToClipboardComponent;
  let fixture: ComponentFixture<CopyToClipboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [CopyToClipboardComponent],
    });

    TestBed.compileComponents();

    fixture = TestBed.createComponent(CopyToClipboardComponent);
    component = fixture.componentInstance;
    component.tooltip = 'Copy to clipboard';
    component.text = 'hello world';
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the copy action initially', () => {
    const button = fixture.nativeElement.querySelector('[role="button"]');

    expect(component.didUserPressCopy()).toBe('not yet');
    expect(button).toBeTruthy();
    expect(button.getAttribute('title')).toBe('Copy to clipboard');
    expect(button.textContent).toContain('content_copy');
  });

  it('shows a success state when the clipboard write succeeds and resets after the delay', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    component.copyToClipboard(component.text);
    await Promise.resolve();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(component.didUserPressCopy()).toBe('yes and succeeded');
    expect(fixture.nativeElement.textContent).toContain('Copied to clipboard');

    await vi.advanceTimersByTimeAsync(700);
    fixture.detectChanges();

    expect(component.didUserPressCopy()).toBe('not yet');
    expect(fixture.nativeElement.querySelector('[role="button"]')).toBeTruthy();
  });

  it('shows an error state when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    component.copyToClipboard(component.text);
    await Promise.resolve();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(component.didUserPressCopy()).toBe('yes but failed');
    expect(fixture.nativeElement.querySelector('.text-status-danger')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Failed to copy');
    expect(fixture.nativeElement.textContent).not.toContain('Copied to clipboard');
    expect(fixture.nativeElement.textContent).toContain('error');
  });

  it('marks the success indicator pointer-events-none so it cannot swallow icon clicks (#5511)', () => {
    component.canCopy = true;
    fixture.detectChanges();

    // The indicator shares the copy icon's grid cell and paints on top of it;
    // without pointer-events-none it intercepts every click while invisible.
    const indicator = fixture.nativeElement.querySelector(
      '.pointer-events-none',
    ) as HTMLElement | null;
    expect(indicator).toBeTruthy();
    expect(indicator!.textContent).toContain('Copied to clipboard');
  });

  describe('copy behaviour', () => {
    let clipboardDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      clipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    });

    afterEach(() => {
      if (clipboardDescriptor) {
        Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
      } else {
        delete (window.navigator as { clipboard?: unknown }).clipboard;
      }
    });

    function setClipboard(value: unknown) {
      Object.defineProperty(window.navigator, 'clipboard', { value, configurable: true });
    }

    it('prefers the async Clipboard API and reports success', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      setClipboard({ writeText });
      component.text = 'https://api.example.com';

      await component.copyToClipboard();

      expect(writeText).toHaveBeenCalledWith('https://api.example.com');
      expect(component.copySuccessful).toBe(true);
      expect(component.copySuccessWait).toBe(true);
    });

    it('falls back to execCommand when the async Clipboard API is unavailable', async () => {
      setClipboard(undefined);
      // jsdom doesn't implement execCommand at all, so assign a stub directly.
      const exec = vi.fn().mockReturnValue(true);
      (document as unknown as { execCommand: unknown }).execCommand = exec;
      component.text = 'fallback-value';

      await component.copyToClipboard();

      expect(exec).toHaveBeenCalledWith('copy');
      expect(component.copySuccessful).toBe(true);
      delete (document as unknown as { execCommand?: unknown }).execCommand;
    });

    it('canCopy is true when only the async Clipboard API is present', () => {
      setClipboard({ writeText: vi.fn() });
      component.ngOnInit();
      expect(component.canCopy).toBe(true);
    });
  });
});
