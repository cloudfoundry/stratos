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

describe('CfAppConfigService.pickInitialCfGuid', () => {
  const cf = (guid: string) => ({ guid, name: guid } as unknown as { guid: string; name: string });

  it('returns null when no CFs are connected', () => {
    expect(CfAppConfigService.pickInitialCfGuid([])).toBeNull();
  });

  it('returns the sole guid when exactly one CF is connected', () => {
    expect(CfAppConfigService.pickInitialCfGuid([cf('a') as never])).toBe('a');
  });

  it('returns the first guid when multiple CFs are connected', () => {
    // GetAllApplications requires a specific endpointGuid to trigger a fetch;
    // picking the first gives the app wall a fetch trigger so apps render.
    // Users switch between endpoints via the CF filter dropdown.
    expect(CfAppConfigService.pickInitialCfGuid([cf('a') as never, cf('b') as never])).toBe('a');
  });
});
