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

    expect(component.didUserPressCopy()).toBe('yes and saw succeeded');
    const button = fixture.nativeElement.querySelector('[role="button"]');
    expect(button).toBeTruthy();
    expect(button.className).toContain('animate-scale-pop-in');
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
    const errorIcon = fixture.nativeElement.querySelector('.text-status-danger');
    expect(errorIcon).toBeTruthy();
    expect(errorIcon.getAttribute('title')).toContain('Failed to copy text');
    expect(fixture.nativeElement.textContent).not.toContain('Copied to clipboard');
    expect(fixture.nativeElement.textContent).toContain('error');
  });

});
