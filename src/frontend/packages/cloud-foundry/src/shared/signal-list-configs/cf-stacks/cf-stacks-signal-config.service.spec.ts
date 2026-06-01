import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CfStacksSignalConfigService } from './cf-stacks-signal-config.service';
import type { StStack } from '../../../services/endpoint-data/stratos-types';

function makeStack(overrides: Partial<StStack>): StStack {
  return {
    guid: 'stack-1',
    name: 'cflinuxfs4',
    description: 'Cloud Foundry Linux-based filesystem',
    default: true,
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-04-22T12:00:00Z',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(stacks: StStack[]): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: stacks,
      pagination: {
        totalResults: stacks.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): CfStacksSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfStacksSignalConfigService,
    ],
  });
  return TestBed.inject(CfStacksSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfStacksSignalConfigService', () => {
  it('exposes empty stacks before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.stacks()).toEqual([]);
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

  it('builds a ViewPipeline driven by the stacks signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads stacks from /pp/v1/cf/stacks/:cnsi', async () => {
    const http = makeHttp([
      makeStack({ guid: 'stack-1', name: 'cflinuxfs4' }),
      makeStack({ guid: 'stack-2', name: 'windows', default: false }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.stacks().length).toBe(2);
    expect(svc.stacks()[0].name).toBe('cflinuxfs4');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/stacks/cnsi-1'),
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
