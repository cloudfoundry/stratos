import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CfSecurityGroupsSignalConfigService } from './cf-security-groups-signal-config.service';
import type { StSecurityGroup } from '../../../../../services/endpoint-data/stratos-types';

function makeGroup(overrides: Partial<StSecurityGroup>): StSecurityGroup {
  return {
    guid: 'sg-1',
    name: 'public_networks',
    globallyEnabledRunning: true,
    globallyEnabledStaging: false,
    ruleCount: 2,
    runningSpaceCount: 1,
    stagingSpaceCount: 0,
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-04-22T12:00:00Z',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(groups: StSecurityGroup[]): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: groups,
      pagination: {
        totalResults: groups.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): CfSecurityGroupsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfSecurityGroupsSignalConfigService,
    ],
  });
  return TestBed.inject(CfSecurityGroupsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfSecurityGroupsSignalConfigService', () => {
  it('exposes empty groups before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.securityGroups()).toEqual([]);
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

  it('builds a ViewPipeline driven by the securityGroups signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads security groups from /pp/v1/cf/security_groups/:cnsi', async () => {
    const http = makeHttp([
      makeGroup({ guid: 'sg-1', name: 'public_networks' }),
      makeGroup({ guid: 'sg-2', name: 'dns', globallyEnabledStaging: true }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.securityGroups().length).toBe(2);
    expect(svc.securityGroups()[0].name).toBe('public_networks');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/security_groups/cnsi-1'),
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
