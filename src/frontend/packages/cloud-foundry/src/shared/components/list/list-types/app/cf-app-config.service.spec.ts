import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';

import { of } from 'rxjs';
import { UtilsService } from '@stratosui/core';
import { CfOrgSpaceDataService } from '../../../../data-services/cf-org-space-service.service';
import { CfAppConfigService } from './cf-app-config.service';

describe('CfAppConfigService', () => {
  beforeEach(() => {
    const mockCfOrgSpaceDataService = {
      isLoading$: of(false),
      cf: { list$: of([{ guid: 'test-guid' }]) },
      setInitialValuesFromAction: vi.fn(),
      org: { list$: of([]) },
      space: { list$: of([]) },
    };

    TestBed.configureTestingModule({
      providers: [
        CfAppConfigService,
        DatePipe,
        UtilsService,
        { provide: CfOrgSpaceDataService, useValue: mockCfOrgSpaceDataService },
        provideMockStore(),
        provideZonelessChangeDetection(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppConfigService);
    expect(service).toBeTruthy();
  });
});
