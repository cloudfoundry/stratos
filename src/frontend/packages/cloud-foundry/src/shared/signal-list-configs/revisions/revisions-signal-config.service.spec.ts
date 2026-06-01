import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RevisionsSignalConfigService } from './revisions-signal-config.service';
import type { RevisionRow, RevisionsResponse } from '../../services/revisions.service';

function makeRevision(overrides: Partial<RevisionRow> = {}): RevisionRow {
  return {
    guid: 'rev-1',
    version: 1,
    description: 'Initial deployment',
    deployable: true,
    created_at: '2026-04-22T12:00:00Z',
    deployed: false,
    ...overrides,
  };
}

function makeResponse(revisions: RevisionRow[], overrides: Partial<RevisionsResponse> = {}): RevisionsResponse {
  return {
    revisions,
    featureEnabled: true,
    partial: { deployedUnknown: false, featureUnknown: false },
    ...overrides,
  };
}

function makeHttp(response: RevisionsResponse): HttpClient {
  return {
    get: vi.fn(() => of(response)),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): RevisionsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      RevisionsSignalConfigService,
    ],
  });
  return TestBed.inject(RevisionsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('RevisionsSignalConfigService', () => {
  it('exposes empty revisions before loadAll', () => {
    const svc = makeSvc(makeHttp(makeResponse([])));
    expect(svc.revisions()).toEqual([]);
  });

  it('exposes featureEnabled=true before loadAll', () => {
    const svc = makeSvc(makeHttp(makeResponse([])));
    expect(svc.featureEnabled()).toBe(true);
  });

  it('exposes deployedUnknown=false before loadAll', () => {
    const svc = makeSvc(makeHttp(makeResponse([])));
    expect(svc.deployedUnknown()).toBe(false);
  });

  it('builds a ViewPipeline after initialize', () => {
    const svc = makeSvc(makeHttp(makeResponse([])));
    svc.initialize('cnsi-1', 'app-1');
    expect(svc.view).toBeDefined();
  });

  it('loads revisions from /pp/v1/cf/apps/:cnsi/:app/revisions', async () => {
    const revisions = [
      makeRevision({ guid: 'rev-1', version: 1 }),
      makeRevision({ guid: 'rev-2', version: 2 }),
    ];
    const http = makeHttp(makeResponse(revisions));
    const svc = makeSvc(http);
    svc.initialize('cnsi-1', 'app-guid-1');
    await svc.loadAll();

    expect(svc.revisions().length).toBe(2);
    expect(svc.revisions()[0].guid).toBe('rev-1');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/apps/cnsi-1/app-guid-1/revisions'),
    );
  });

  it('sets featureEnabled from response', async () => {
    const http = makeHttp(makeResponse([], { featureEnabled: false }));
    const svc = makeSvc(http);
    svc.initialize('cnsi-1', 'app-1');
    await svc.loadAll();

    expect(svc.featureEnabled()).toBe(false);
  });

  it('sets deployedUnknown from partial flags', async () => {
    const http = makeHttp(makeResponse([], {
      partial: { deployedUnknown: true, featureUnknown: false },
    }));
    const svc = makeSvc(http);
    svc.initialize('cnsi-1', 'app-1');
    await svc.loadAll();

    expect(svc.deployedUnknown()).toBe(true);
  });

  it('clearFilters resets nameFilter, sort and pageIndex to defaults', () => {
    const svc = makeSvc(makeHttp(makeResponse([])));
    svc.initialize('cnsi-1', 'app-1');
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'version', direction: 'desc' });
    svc.pageIndex.set(3);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('desc');  // default sort is desc for version
    expect(svc.pageIndex()).toBe(0);
  });
});
