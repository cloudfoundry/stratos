import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyToClipboardComponent } from './copy-to-clipboard.component';

describe('CopyToClipboardComponent', () => {
  let component: CopyToClipboardComponent;
  let fixture: ComponentFixture<CopyToClipboardComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [CopyToClipboardComponent],
    });

    TestBed.compileComponents();

    fixture = TestBed.createComponent(CopyToClipboardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tooltip', 'Copy to clipboard');
    fixture.componentRef.setInput('text', 'hello world');
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const live = (): HTMLElement => fixture.nativeElement.querySelector('[aria-live="polite"]');

  it('renders the copy action initially', () => {
    const button = fixture.nativeElement.querySelector('button')

    expect(component.didUserPressCopy()).toBe('not yet');
    expect(button).toBeTruthy();
    expect(button.getAttribute('title')).toBe('Copy to clipboard');
    expect(button.textContent).toContain('content_copy');
    // The live region is there before anything is said in it.
    expect(live()?.textContent?.trim()).toBe('');
  });

  it('shows a success state when the clipboard write succeeds and resets after the delay', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    component.copyToClipboard(component.text());
    await Promise.resolve();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(component.didUserPressCopy()).toBe('yes and succeeded');
    expect(fixture.nativeElement.textContent).toContain('Copied to clipboard');
    // Announced: the on-screen tick and text are not.
    expect(live().textContent?.trim()).toBe('Copied to clipboard');

    // Real timers: under fake timers the state set by the component's 800 ms
    // timer changed, but whenStable did not render it.
    await new Promise(resolve => setTimeout(resolve, 850));
    await fixture.whenStable();

    expect(component.didUserPressCopy()).toBe('yes and saw succeeded');
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.className).toContain('animate-scale-pop-in');
  });

  it('shows an error state when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    component.copyToClipboard(component.text());
    await Promise.resolve();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(component.didUserPressCopy()).toBe('yes but failed');
    const errorIcon = fixture.nativeElement.querySelector('.text-status-danger');
    expect(errorIcon).toBeTruthy();
    expect(errorIcon.getAttribute('title')).toContain('Failed to copy text');
    expect(fixture.nativeElement.textContent).not.toContain('Copied to clipboard');
    expect(fixture.nativeElement.textContent).toContain('error');
    expect(live().textContent?.trim()).toBe('Copy failed');
  });

});
