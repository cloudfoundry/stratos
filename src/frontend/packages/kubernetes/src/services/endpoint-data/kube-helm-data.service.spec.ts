import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KubeHelmDataService } from './kube-helm-data.service';
import { HelmInstallPayload, HelmUpgradePayload } from './kube-types';

const RELEASES_URL = '/pp/v1/helm/releases';
const CHARTS_URL = '/pp/v1/chartsvc/v1/charts';

describe('KubeHelmDataService', () => {
  let svc: KubeHelmDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeHelmDataService,
      ],
    });
    svc = TestBed.inject(KubeHelmDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts with empty signals and zero loading flags', () => {
    expect(svc.allReleases()()).toEqual([]);
    expect(svc.monocularCharts()()).toEqual([]);
    expect(svc.isLoadingReleases()()).toBe(false);
    expect(svc.isLoadingCharts()()).toBe(false);
    expect(svc.errors()()).toEqual([]);
  });

  it('loadReleases populates the releases signal across endpoints', async () => {
    const promise = svc.loadReleases();
    httpMock.expectOne(RELEASES_URL).flush({
      'kube-1': [
        { name: 'rel-a', namespace: 'ns1', info: { status: 'deployed', last_deployed: { seconds: 100, nanos: 0 } }, chart: { metadata: { version: '1.0.0' } } },
      ],
      'kube-2': [
        { name: 'rel-b', namespace: 'ns2', info: { status: 'failed', last_deployed: { seconds: 200, nanos: 0 } }, chart: { metadata: { version: '2.0.0' } } },
      ],
    });
    await promise;
    const all = svc.allReleases()();
    expect(all).toHaveLength(2);
    expect(all.map(r => r.guid).sort()).toEqual(['kube-1:ns1:rel-a', 'kube-2:ns2:rel-b']);
    expect(all[0].lastDeployed instanceof Date).toBe(true);
  });

  it('releasesForEndpoint filters by endpoint', async () => {
    const promise = svc.loadReleases();
    httpMock.expectOne(RELEASES_URL).flush({
      'kube-1': [
        { name: 'rel-a', namespace: 'ns1', info: { status: 'deployed' }, chart: { metadata: {} } },
        { name: 'rel-c', namespace: 'ns3', info: { status: 'deployed' }, chart: { metadata: {} } },
      ],
      'kube-2': [
        { name: 'rel-b', namespace: 'ns2', info: { status: 'failed' }, chart: { metadata: {} } },
      ],
    });
    await promise;
    expect(svc.releasesForEndpoint('kube-1')()).toHaveLength(2);
    expect(svc.releasesForEndpoint('kube-2')()).toHaveLength(1);
    expect(svc.releasesForEndpoint('kube-3')()).toHaveLength(0);
  });

  it('loadCharts populates the charts signal and promotes name', async () => {
    const promise = svc.loadCharts();
    httpMock.expectOne(CHARTS_URL).flush({
      data: [
        { id: 'c1', attributes: { name: 'nginx', repo: { name: 'bitnami' } } },
      ],
    });
    await promise;
    expect(svc.monocularCharts()()).toHaveLength(1);
    expect(svc.monocularCharts()()[0].name).toBe('nginx');
  });

  it('install posts payload then refetches releases', async () => {
    const payload: HelmInstallPayload = {
      endpoint: 'kube-1',
      releaseName: 'rel-x',
      releaseNamespace: 'ns1',
      values: '{}',
      chart: { name: 'nginx', repo: 'bitnami', version: '1.0.0' },
      monocularEndpoint: null,
      chartUrl: 'http://example/nginx-1.0.0.tgz',
    };
    const promise = svc.install(payload);
    const installReq = httpMock.expectOne('/pp/v1/helm/install');
    expect(installReq.request.method).toBe('POST');
    expect(installReq.request.body).toEqual(payload);
    installReq.flush(null);
    await Promise.resolve();
    httpMock.expectOne(RELEASES_URL).flush({});
    await promise;
  });

  it('upgrade posts to the release URL then refetches', async () => {
    const payload: HelmUpgradePayload = {
      values: '{}',
      chart: { name: 'nginx', repo: 'bitnami', version: '2.0.0' },
      monocularEndpoint: null,
      chartUrl: 'http://example/nginx-2.0.0.tgz',
    };
    const promise = svc.upgrade('kube-1', 'ns1', 'rel-a', payload);
    const upReq = httpMock.expectOne('/pp/v1/helm/releases/kube-1/ns1/rel-a');
    expect(upReq.request.method).toBe('POST');
    upReq.flush(null);
    await Promise.resolve();
    httpMock.expectOne(RELEASES_URL).flush({});
    await promise;
  });

  it('delete fires DELETE then refetches', async () => {
    const promise = svc.delete('kube-1', 'ns1', 'rel-a');
    const delReq = httpMock.expectOne('/pp/v1/helm/releases/kube-1/ns1/rel-a');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
    await Promise.resolve();
    httpMock.expectOne(RELEASES_URL).flush({});
    await promise;
  });

  it('records an error if loadReleases fails', async () => {
    const promise = svc.loadReleases();
    httpMock.expectOne(RELEASES_URL).flush(
      { error: { message: 'boom' } },
      { status: 500, statusText: 'Server Error' },
    );
    await promise;
    expect(svc.errors()().length).toBeGreaterThan(0);
    expect(svc.errors()()[0].title).toBe('helm-releases');
  });

  it('refresh re-runs both legs', async () => {
    const promise = svc.refresh();
    httpMock.expectOne(RELEASES_URL).flush({});
    httpMock.expectOne(CHARTS_URL).flush({ data: [] });
    await promise;
    expect(svc.releasesLastFetched()()).not.toBeNull();
    expect(svc.chartsLastFetched()()).not.toBeNull();
  });
});
