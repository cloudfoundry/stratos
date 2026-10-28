import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CopyToClipboardComponent } from '../../../shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { ApiKeysDataService } from '../api-keys-data.service';
import { ApiKeysPageComponent } from './api-keys-page.component';

describe('ApiKeysPageComponent', () => {
  let component: ApiKeysPageComponent;
  let fixture: ComponentFixture<ApiKeysPageComponent>;

  const mockDialogService = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiKeysPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TailwindDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiKeysPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens Create an API Key with the dialog padding', async () => {
    mockDialogService.open.mockReturnValue({ afterClosed: () => of(null) });
    await component.addApiKey();

    const config = mockDialogService.open.mock.calls.at(-1)?.[1];
    expect(config.panelClass).toContain('p-6');
  });

  // The page's load() lists the keys; the new key is among them.
  async function showNewKey() {
    TestBed.inject(HttpTestingController).expectOne('/pp/v1/api_keys')
      .flush([{ guid: 'g', comment: 'tool', user_guid: 'u', last_used: null }]);
    await fixture.whenStable();
    component.keyDetails.set({ guid: 'g', secret: 'the-secret' } as never);
    await fixture.whenStable();
  }
  const secretText = () => fixture.nativeElement.querySelector('#apikey-secret')?.textContent ?? '';
  const toggle = (): HTMLButtonElement => fixture.nativeElement.querySelector('#apikey-secret button[aria-label="Hide Secret"]');

  it('offers to copy a new key\'s secret', async () => {
    await showNewKey();

    const copy = fixture.debugElement.query(By.directive(CopyToClipboardComponent));
    expect(copy?.componentInstance.text()).toBe('the-secret');
  });

  // Someone looking at the screen should not read the key as it arrives.
  it('hides a new key\'s secret until asked', async () => {
    await showNewKey();
    expect(secretText()).not.toContain('the-secret');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    // A screen reader hears "hidden", not a run of bullets.
    const li: HTMLElement = fixture.nativeElement.querySelector('#apikey-secret');
    expect(li.querySelector('.sr-only')?.textContent).toBe('hidden');
    expect(li.querySelector('[aria-hidden="true"]')?.textContent).toMatch(/^•+$/);

    toggle().click();
    await fixture.whenStable();
    expect(secretText()).toContain('the-secret');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('drops the new key\'s card when that key is deleted', async () => {
    await showNewKey();
    const removed = TestBed.inject(ApiKeysDataService).remove('g');
    TestBed.inject(HttpTestingController).expectOne(r => r.method === 'DELETE').flush(null);
    await removed;
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#apikey-secret')).toBeNull();
  });
});
