import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeAnalysisDataService } from './kube-analysis-data.service';

const KUBE_GUID = 'kube-1';
const REPORTS_URL = `/pp/v1/analysis/reports/${KUBE_GUID}`;

describe('KubeAnalysisDataService', () => {
  let svc: KubeAnalysisDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeAnalysisDataService,
      ],
    });
    svc = TestBed.inject(KubeAnalysisDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty list signals before any fetch', () => {
    expect(svc.reportsForEndpoint(KUBE_GUID)()).toEqual([]);
    expect(svc.errors()()).toEqual([]);
    expect(svc.unavailable()).toEqual([]);
  });

  it('loadReports fetches and populates the per-endpoint signal', async () => {
    const items = [
      { id: 'r1', name: 'Report 1', type: 'popeye', status: 'completed' },
      { id: 'r2', name: 'Report 2', type: 'kubescore', status: 'pending' },
    ];
    const promise = firstValueFrom(svc.loadReports(KUBE_GUID));
    httpMock.expectOne(REPORTS_URL).flush(items);
    const result = await promise;
    expect(result).toHaveLength(2);
    expect(svc.reportsForEndpoint(KUBE_GUID)()).toHaveLength(2);
    expect(svc.reportsForEndpoint(KUBE_GUID)()[0].id).toBe('r1');
  });

  it('loadReports honours TTL and returns the cached list without re-fetching', async () => {
    const items = [{ id: 'r1', name: 'Report 1', type: 'popeye', status: 'completed' }];
    const first = firstValueFrom(svc.loadReports(KUBE_GUID));
    httpMock.expectOne(REPORTS_URL).flush(items);
    await first;

    // Second call within TTL — no HTTP request issued.
    const second = await firstValueFrom(svc.loadReports(KUBE_GUID));
    expect(second).toHaveLength(1);
    httpMock.expectNone(REPORTS_URL);
  });

  it('refresh forces a fresh fetch even within TTL', async () => {
    const first = firstValueFrom(svc.loadReports(KUBE_GUID));
    httpMock.expectOne(REPORTS_URL).flush([{ id: 'r1', name: 'Report 1', type: 'popeye', status: 'completed' }]);
    await first;

    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(REPORTS_URL).flush([
      { id: 'r1', name: 'Report 1', type: 'popeye', status: 'completed' },
      { id: 'r2', name: 'Report 2', type: 'popeye', status: 'completed' },
    ]);
    await refreshing;

    expect(svc.reportsForEndpoint(KUBE_GUID)()).toHaveLength(2);
  });

  it('failure on list fetch surfaces tristate unavailable + error', async () => {
    const promise = firstValueFrom(svc.loadReports(KUBE_GUID));
    httpMock.expectOne(REPORTS_URL).flush('forbidden', { status: 403, statusText: 'Forbidden' });
    const result = await promise;
    expect(result).toEqual([]);
    expect(svc.unavailable()).toContain(KUBE_GUID);
    expect(svc.errors()()).toHaveLength(1);
    expect(svc.errors()()[0].code).toBe('UNAUTHORIZED');
  });

  it('reportById fetches detail and caches by (endpoint, id)', async () => {
    const url = `/pp/v1/analysis/reports/${KUBE_GUID}/r1`;
    const promise = firstValueFrom(svc.reportById(KUBE_GUID, 'r1'));
    httpMock.expectOne(url).flush({
      id: 'r1', name: 'Report 1', type: 'popeye', status: 'completed', format: 'unknown',
    });
    const report = await promise;
    expect(report.id).toBe('r1');
    expect(report.name).toBe('Report 1');

    // Second call within TTL — cached, no HTTP.
    const cached = await firstValueFrom(svc.reportById(KUBE_GUID, 'r1'));
    expect(cached.id).toBe('r1');
    httpMock.expectNone(url);
  });

  it('reportById refresh: true forces a re-fetch', async () => {
    const url = `/pp/v1/analysis/reports/${KUBE_GUID}/r1`;
    const first = firstValueFrom(svc.reportById(KUBE_GUID, 'r1'));
    httpMock.expectOne(url).flush({ id: 'r1', name: 'v1', type: 'popeye', status: 'completed' });
    await first;

    const second = firstValueFrom(svc.reportById(KUBE_GUID, 'r1', { refresh: true }));
    httpMock.expectOne(url).flush({ id: 'r1', name: 'v2', type: 'popeye', status: 'completed' });
    const result = await second;
    expect(result.name).toBe('v2');
  });

  it('allReports aggregates reportsForEndpoint across multiple guids', async () => {
    const otherGuid = 'kube-2';
    const a = firstValueFrom(svc.loadReports(KUBE_GUID));
    httpMock.expectOne(REPORTS_URL).flush([{ id: 'r1', name: 'A', type: 'popeye', status: 'completed' }]);
    await a;

    const b = firstValueFrom(svc.loadReports(otherGuid));
    httpMock.expectOne(`/pp/v1/analysis/reports/${otherGuid}`).flush([
      { id: 'r2', name: 'B', type: 'popeye', status: 'completed' },
    ]);
    await b;

    expect(svc.allReports([KUBE_GUID, otherGuid])()).toHaveLength(2);
  });
});
