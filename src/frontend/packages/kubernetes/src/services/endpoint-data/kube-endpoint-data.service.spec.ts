import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataService } from './kube-endpoint-data.service';

const KUBE_GUID = 'kube-1';
const VERSION_URL = '/pp/v1/proxy/version';
const NAMESPACES_URL = '/pp/v1/proxy/api/v1/namespaces?limit=500';
const NODES_URL = '/pp/v1/proxy/api/v1/nodes?limit=500';

function buildService(): { service: KubeEndpointDataService; httpMock: HttpTestingController } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const httpMock = TestBed.inject(HttpTestingController);
  const service = new KubeEndpointDataService(TestBed.inject(HttpClient), KUBE_GUID);
  return { service, httpMock };
}

describe('KubeEndpointDataService', () => {
  let service: KubeEndpointDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const built = buildService();
    service = built.service;
    httpMock = built.httpMock;
  });

  afterEach(() => httpMock.verify());

  it('starts with empty signals and isLoading false', () => {
    expect(service.kubeVersion()).toBeNull();
    expect(service.nodeCount()).toBe(0);
    expect(service.namespaces()).toEqual([]);
    expect(service.isLoading()).toBeFalsy();
    expect(service.errors()).toEqual([]);
    expect(service.unavailable()).toEqual([]);
    expect(service.lastFetched()).toBeNull();
    expect(service.clusterName()).toBe(KUBE_GUID);
  });

  it('sets isLoading true while load() is in flight', () => {
    void firstValueFrom(service.load());
    expect(service.isLoading()).toBe(true);
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.27.3' } });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
  });

  it('populates kubeVersion + namespaces + nodeCount on a happy load()', async () => {
    const ns = {
      metadata: { name: 'default' },
      spec: {},
      status: { phase: 'Active' },
    };
    const loadPromise = firstValueFrom(service.load());

    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [ns] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [{}, {}, {}] } });

    await loadPromise;

    expect(service.kubeVersion()).toBe('v1.30.0');
    expect(service.namespaces()).toHaveLength(1);
    expect(service.namespaces()[0].kubeGuid).toBe(KUBE_GUID);
    expect(service.namespaces()[0].metadata.kubeId).toBe(KUBE_GUID);
    expect(service.nodeCount()).toBe(3);
    expect(service.errors()).toEqual([]);
    expect(service.unavailable()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.lastFetched()).toBeInstanceOf(Date);
  });

  it('marks kubeVersion unavailable when /version returns 403 (tristate)', async () => {
    const loadPromise = firstValueFrom(service.load());

    httpMock.expectOne(VERSION_URL).flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });

    await loadPromise;

    expect(service.kubeVersion()).toBeNull();
    expect(service.unavailable()).toContain('kubeVersion');
    const verErr = service.errors().find(e => (e.affected ?? []).includes('kubeVersion'));
    expect(verErr).toBeDefined();
    expect(verErr?.code).toBe('UNAUTHORIZED');
    // Other legs should still have populated
    expect(service.namespaces()).toEqual([]);
    expect(service.nodeCount()).toBe(0);
  });

  it('does not crash when namespaces leg errors; namespaces signal stays empty', async () => {
    const loadPromise = firstValueFrom(service.load());

    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Network down' });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });

    await loadPromise;

    expect(service.namespaces()).toEqual([]);
    expect(service.unavailable()).toContain('namespaces');
    expect(service.kubeVersion()).toBe('v1.30.0');
  });

  it('refresh("namespaces") re-fetches only the namespaces endpoint', async () => {
    // First load
    const loadPromise = firstValueFrom(service.load());
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loadPromise;

    const refreshPromise = service.refresh('namespaces');
    httpMock.expectOne(NAMESPACES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'kube-system' } }] },
    });
    await refreshPromise;

    expect(service.namespaces()).toHaveLength(1);
    expect(service.namespaces()[0].metadata.name).toBe('kube-system');
  });

  it('currentData() reflects the current signal values', async () => {
    const loadPromise = firstValueFrom(service.load());
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'default' } }] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [{}] } });
    await loadPromise;

    const snap = service.currentData();
    expect(snap.kubeGuid).toBe(KUBE_GUID);
    expect(snap.kubeVersion).toBe('v1.30.0');
    expect(snap.nodeCount).toBe(1);
    expect(snap.namespaceCount).toBe(1);
    expect(snap.namespaces).toHaveLength(1);
  });

  it('falls back to "major.minor" when /version omits gitVersion', async () => {
    const loadPromise = firstValueFrom(service.load());
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { major: '1', minor: '29' } });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loadPromise;

    expect(service.kubeVersion()).toBe('1.29');
  });
});
