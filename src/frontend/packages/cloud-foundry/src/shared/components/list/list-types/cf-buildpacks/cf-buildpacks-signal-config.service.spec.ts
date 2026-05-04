import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CfBuildpacksSignalConfigService } from './cf-buildpacks-signal-config.service';
import type { StBuildpack } from '../../../../../services/endpoint-data/stratos-types';

function makeBuildpack(overrides: Partial<StBuildpack>): StBuildpack {
  return {
    guid: 'bp-1',
    name: 'java_buildpack',
    state: 'READY',
    filename: 'java_buildpack-cached-cflinuxfs4-v4.50.tgz',
    stack: 'cflinuxfs4',
    position: 1,
    lifecycle: 'buildpack',
    enabled: true,
    locked: false,
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-04-22T12:00:00Z',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(buildpacks: StBuildpack[]): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: buildpacks,
      pagination: {
        totalResults: buildpacks.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): CfBuildpacksSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfBuildpacksSignalConfigService,
    ],
  });
  return TestBed.inject(CfBuildpacksSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfBuildpacksSignalConfigService', () => {
  it('exposes empty buildpacks before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.buildpacks()).toEqual([]);
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

  it('builds a ViewPipeline driven by the buildpacks signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads buildpacks from /pp/v1/cf/buildpacks/:cnsi', async () => {
    const http = makeHttp([
      makeBuildpack({ guid: 'bp-1', name: 'java_buildpack' }),
      makeBuildpack({ guid: 'bp-2', name: 'go_buildpack', position: 2 }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.buildpacks().length).toBe(2);
    expect(svc.buildpacks()[0].name).toBe('java_buildpack');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/buildpacks/cnsi-1'),
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
