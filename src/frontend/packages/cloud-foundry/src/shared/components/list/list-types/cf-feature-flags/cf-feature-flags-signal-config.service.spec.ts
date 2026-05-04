import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CfFeatureFlagsSignalConfigService } from './cf-feature-flags-signal-config.service';
import type { StFeatureFlag } from '../../../../../services/endpoint-data/stratos-types';

function makeFlag(overrides: Partial<StFeatureFlag>): StFeatureFlag {
  return {
    name: 'user_org_creation',
    enabled: true,
    customErrorMessage: '',
    cnsiGuid: 'cnsi-1',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(flags: StFeatureFlag[]): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: flags,
      pagination: {
        totalResults: flags.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): CfFeatureFlagsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfFeatureFlagsSignalConfigService,
    ],
  });
  return TestBed.inject(CfFeatureFlagsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfFeatureFlagsSignalConfigService', () => {
  it('exposes empty flags before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.featureFlags()).toEqual([]);
  });

  it('exposes the filter, sort, pageSize, pageIndex, nameFilter signals', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
  });

  it('builds a ViewPipeline driven by the featureFlags signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads feature flags from /pp/v1/cf/feature_flags/:cnsi', async () => {
    const http = makeHttp([
      makeFlag({ name: 'user_org_creation', enabled: true }),
      makeFlag({ name: 'app_bits_upload', enabled: false, customErrorMessage: 'Disabled' }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.featureFlags().length).toBe(2);
    expect(svc.featureFlags()[0].name).toBe('user_org_creation');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/feature_flags/cnsi-1'),
    );
  });

  it('clearFilters resets nameFilter, sort and pageIndex to defaults', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(3);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });
});
