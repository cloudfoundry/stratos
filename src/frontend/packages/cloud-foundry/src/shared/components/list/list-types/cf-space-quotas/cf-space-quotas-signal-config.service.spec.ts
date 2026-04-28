import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CfSpaceQuotasSignalConfigService } from './cf-space-quotas-signal-config.service';
import type { StSpaceQuota } from '../../../../../services/endpoint-data/stratos-types';

function makeQuota(overrides: Partial<StSpaceQuota>): StSpaceQuota {
  return {
    guid: 'sq-1',
    name: 'small',
    totalMemoryInMB: 2048,
    totalInstanceMemoryInMB: 1024,
    totalInstances: 50,
    totalAppTasks: 25,
    paidServicesAllowed: true,
    totalServiceInstances: 10,
    totalServiceKeys: 10,
    totalRoutes: 50,
    totalReservedPorts: 5,
    organizationGuid: 'org-1',
    spaceCount: 2,
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-04-22T12:00:00Z',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(quotas: StSpaceQuota[]): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: quotas,
      pagination: {
        totalResults: quotas.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): CfSpaceQuotasSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfSpaceQuotasSignalConfigService,
    ],
  });
  return TestBed.inject(CfSpaceQuotasSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfSpaceQuotasSignalConfigService', () => {
  it('exposes empty quotas before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.spaceQuotas()).toEqual([]);
  });

  it('exposes filter, sort, pageSize, pageIndex, nameFilter signals', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
  });

  it('builds a ViewPipeline driven by the spaceQuotas signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads space quotas from /pp/v1/cf/space_quotas/:cnsi', async () => {
    const http = makeHttp([
      makeQuota({ guid: 'sq-1', name: 'small' }),
      makeQuota({ guid: 'sq-2', name: 'large' }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.spaceQuotas().length).toBe(2);
    expect(svc.spaceQuotas()[0].name).toBe('small');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/space_quotas/cnsi-1'),
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
