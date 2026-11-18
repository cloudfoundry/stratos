import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MetadataItemComponent } from './metadata-item.component';
import { CoreModule } from '../../../core/core.module';
import { CopyToClipboardComponent } from '../copy-to-clipboard/copy-to-clipboard.component';

describe('MetadataItemComponent', () => {
  let component: MetadataItemComponent;
  let fixture: ComponentFixture<MetadataItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CoreModule,
        MetadataItemComponent,
        CopyToClipboardComponent,
      ],
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The copy glyph's own change (to check_circle) is not spoken, so a
  // live region, there before the copy, says how it went.
  describe('the copy glyph', () => {
    const live = () => fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement | null;
    const glyph = () => fixture.nativeElement.querySelector('.metadata-item__copy') as HTMLElement;
    const copyWith = async (writeText: () => Promise<void>) => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      fixture.componentRef.setInput('label', 'Application GUID');
      fixture.componentRef.setInput('clipboardValue', 'e7842df2');
      await fixture.whenStable();
      expect(live()?.textContent?.trim()).toBe('');
      glyph().click();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
    };

    it('announces a copy that worked', async () => {
      await copyWith(() => Promise.resolve());
      expect(live()!.textContent!.trim()).toBe('Copied to clipboard');
      expect(glyph().getAttribute('aria-label')).toBe('Copied');
    });

    it('announces a copy that failed, and does not show it as copied', async () => {
      await copyWith(() => Promise.reject(new Error('denied')));
      expect(live()!.textContent!.trim()).toBe('Copy failed');
      expect(glyph().getAttribute('aria-label')).toBe('Copy to clipboard');
      expect(glyph().textContent!.trim()).toBe('content_copy');
    });
  });
});
