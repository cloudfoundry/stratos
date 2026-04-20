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
  const cf = (guid: string, url: string) => ({
    guid,
    name: guid,
    cnsi_type: 'cf',
    connectionStatus: 'connected',
    api_endpoint: { Scheme: 'https', Host: new URL(url).host, Path: '' },
  } as any);

  it('returns the sole guid when exactly one CF is connected', () => {
    expect(CfAppConfigService.pickInitialCfGuid([cf('a', 'https://cf-a.example.com')])).toBe('a');
  });

  it('returns null for multiple CFs with distinct URLs (All view is meaningful)', () => {
    const cfs = [cf('a', 'https://cf-a.example.com'), cf('b', 'https://cf-b.example.com')];
    expect(CfAppConfigService.pickInitialCfGuid(cfs)).toBeNull();
  });

  it('returns the first guid when multiple CFs share a URL (auto-scope to one permission view)', () => {
    const cfs = [cf('a', 'https://cf.example.com'), cf('b', 'https://cf.example.com')];
    expect(CfAppConfigService.pickInitialCfGuid(cfs)).toBe('a');
  });
});
