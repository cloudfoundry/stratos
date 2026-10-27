import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CopyToClipboardComponent } from '../../../shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
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

  it('offers to copy a new key\'s secret', async () => {
    component.keyDetails.set({ guid: 'g', secret: 'the-secret' } as never);
    await fixture.whenStable();

    const copy = fixture.debugElement.query(By.directive(CopyToClipboardComponent));
    expect(copy?.componentInstance.text()).toBe('the-secret');
  });
});
