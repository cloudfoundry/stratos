import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CfOrgQuotasSignalConfigService } from './cf-org-quotas-signal-config.service';
import type { StOrgQuota } from '../../../../../services/endpoint-data/stratos-types';

function makeQuota(overrides: Partial<StOrgQuota>): StOrgQuota {
  return {
    guid: 'q-1',
    name: 'default',
    totalMemoryInMB: 102400,
    totalInstanceMemoryInMB: 2048,
    totalInstances: 1000,
    totalAppTasks: 500,
    paidServicesAllowed: true,
    totalServiceInstances: 250,
    totalServiceKeys: 250,
    totalRoutes: 1000,
    totalReservedPorts: 100,
    totalDomains: 10,
    organizationCount: 2,
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-04-22T12:00:00Z',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(quotas: StOrgQuota[]): HttpClient {
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

function makeSvc(http: HttpClient): CfOrgQuotasSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfOrgQuotasSignalConfigService,
    ],
  });
  return TestBed.inject(CfOrgQuotasSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfOrgQuotasSignalConfigService', () => {
  it('exposes empty quotas before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.orgQuotas()).toEqual([]);
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

  it('builds a ViewPipeline driven by the orgQuotas signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads org quotas from /pp/v1/cf/organization_quotas/:cnsi', async () => {
    const http = makeHttp([
      makeQuota({ guid: 'q-1', name: 'default' }),
      makeQuota({ guid: 'q-2', name: 'large' }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.orgQuotas().length).toBe(2);
    expect(svc.orgQuotas()[0].name).toBe('default');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/organization_quotas/cnsi-1'),
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
