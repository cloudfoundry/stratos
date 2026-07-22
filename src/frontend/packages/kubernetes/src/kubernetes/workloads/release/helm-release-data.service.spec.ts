import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HelmReleaseGraph, HelmReleaseResources } from '../workload.types';
import { HelmReleaseDataService } from './helm-release-data.service';

const GUID = 'cnsi-1:ns-a:rel-x';
const DETAIL_URL = '/pp/v1/helm/releases/cnsi-1/ns-a/rel-x';
const HISTORY_URL = '/pp/v1/helm/releases/cnsi-1/ns-a/rel-x/history';

describe('HelmReleaseDataService', () => {
  let svc: HelmReleaseDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        HelmReleaseDataService,
      ],
    });
    svc = TestBed.inject(HelmReleaseDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts with undefined surfaces and not-fetching', () => {
    expect(svc.releaseDetail(GUID)()).toBeUndefined();
    expect(svc.history(GUID)()).toBeUndefined();
    expect(svc.graph(GUID)()).toBeUndefined();
    expect(svc.resources(GUID)()).toBeUndefined();
    expect(svc.isFetchingDetail(GUID)()).toBe(false);
  });

  it('loadReleaseDetail GETs the release URL and populates the signal', async () => {
    const promise = svc.loadReleaseDetail('cnsi-1', 'ns-a', 'rel-x');
    const req = httpMock.expectOne(DETAIL_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: { name: 'nginx', version: '1.0.0' } } });
    await promise;
    const detail = svc.releaseDetail(GUID)();
    expect(detail?.name).toBe('rel-x');
    expect(detail?.chart.metadata.version).toBe('1.0.0');
    expect(svc.isFetchingDetail(GUID)()).toBe(false);
  });

  it('isFetchingDetail is true while the request is in flight', async () => {
    const promise = svc.loadReleaseDetail('cnsi-1', 'ns-a', 'rel-x');
    expect(svc.isFetchingDetail(GUID)()).toBe(true);
    httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: {} } });
    await promise;
    expect(svc.isFetchingDetail(GUID)()).toBe(false);
  });

  it('loadHistory GETs the history URL and stores the revisions array', async () => {
    const promise = svc.loadHistory('cnsi-1', 'ns-a', 'rel-x');
    const req = httpMock.expectOne(HISTORY_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ revisions: [{ revision: 1, status: 'deployed' }, { revision: 2, status: 'superseded' }] });
    await promise;
    expect(svc.history(GUID)()).toHaveLength(2);
    expect(svc.history(GUID)()?.[1].revision).toBe(2);
  });

  it('setGraph / setResources populate the socket-fed signals', () => {
    const graph = { endpointId: 'cnsi-1', releaseTitle: 'rel-x', nodes: {}, links: {} } as HelmReleaseGraph;
    const resources = { endpointId: 'cnsi-1', releaseTitle: 'rel-x', kind: 'Resources', data: [] } as HelmReleaseResources;
    svc.setGraph(GUID, graph);
    svc.setResources(GUID, resources);
    expect(svc.graph(GUID)()).toBe(graph);
    expect(svc.resources(GUID)()).toBe(resources);
  });

  it('detail signal stays undefined and not-fetching on error', async () => {
    const promise = svc.loadReleaseDetail('cnsi-1', 'ns-a', 'rel-x');
    httpMock.expectOne(DETAIL_URL).flush({ error: { message: 'boom' } }, { status: 500, statusText: 'Server Error' });
    await promise;
    expect(svc.releaseDetail(GUID)()).toBeUndefined();
    expect(svc.isFetchingDetail(GUID)()).toBe(false);
  });

  it('returns stable signal identity per guid', () => {
    expect(svc.releaseDetail(GUID)).toBe(svc.releaseDetail(GUID));
    expect(svc.graph(GUID)).toBe(svc.graph(GUID));
  });
});
