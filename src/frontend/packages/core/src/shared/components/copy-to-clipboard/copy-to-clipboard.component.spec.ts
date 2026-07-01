import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { CopyToClipboardComponent } from './copy-to-clipboard.component';

describe('CopyToClipboardComponent', () => {
  let component: CopyToClipboardComponent;
  let fixture: ComponentFixture<CopyToClipboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ],
      imports: [
        CopyToClipboardComponent, // Now standalone
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyToClipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the copy icon in normal flow (not absolutely positioned), stacked via grid', () => {
    component.canCopy = true;
    fixture.detectChanges();

    const icons = Array.from(
      fixture.nativeElement.querySelectorAll('.material-icons'),
    ) as HTMLElement[];
    const copyIcon = icons.find(el => el.textContent?.trim() === 'content_copy');

    expect(copyIcon).toBeTruthy();
    // Absolute positioning was the cause of the row-misalignment — the icon
    // must flow so it tracks its row.
    expect(copyIcon!.classList.contains('absolute')).toBe(false);
    // Icon + transient success indicator share one grid cell, so the column
    // reserves space for the "Copied to clipboard" text without overlap.
    expect(fixture.nativeElement.querySelector('.inline-grid')).toBeTruthy();
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
