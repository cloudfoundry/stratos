import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  MAT_DIALOG_DATA,
  TailwindDialogRef,
  TailwindSnackBarService,
} from '@stratosui/core';

import { ApplyQuotaToSpacesDialogComponent } from './apply-quota-to-spaces-dialog.component';

describe('ApplyQuotaToSpacesDialogComponent', () => {
  let component: ApplyQuotaToSpacesDialogComponent;
  let fixture: ComponentFixture<ApplyQuotaToSpacesDialogComponent>;
  let httpMock: HttpTestingController;
  const close = vi.fn();
  const data = { cfGuid: 'cnsi-1', orgGuid: 'org-1', quotaGuid: 'sq-1', quotaName: 'small' };

  beforeEach(() => {
    close.mockReset();
    TestBed.configureTestingModule({
      imports: [ApplyQuotaToSpacesDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: TailwindDialogRef, useValue: { close } },
        { provide: TailwindSnackBarService, useValue: { open: vi.fn(), error: vi.fn() } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ApplyQuotaToSpacesDialogComponent);
    component = fixture.componentInstance;

    // On construction the dialog loads the org's spaces.
    const load = httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces');
    expect(load.request.method).toBe('GET');
    load.flush({
      resources: [
        { guid: 'space-a', name: 'dev' },
        { guid: 'space-b', name: 'prod' },
      ],
      totalResults: 2,
    });
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('applies the quota to the selected spaces via the relationships endpoint', async () => {
    (component as unknown as { toggle: (g: string) => void }).toggle('space-b');

    const applied = (component as unknown as { apply: () => Promise<void> }).apply();

    const req = httpMock.expectOne('/pp/v1/cf/space_quotas/cnsi-1/sq-1/relationships/spaces');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ space_guids: ['space-b'] });
    req.flush({});

    await applied;
    expect(close).toHaveBeenCalledWith(true);
  });

  it('does not POST when no space is selected', () => {
    (component as unknown as { apply: () => Promise<void> }).apply();
    httpMock.expectNone('/pp/v1/cf/space_quotas/cnsi-1/sq-1/relationships/spaces');
  });
});
