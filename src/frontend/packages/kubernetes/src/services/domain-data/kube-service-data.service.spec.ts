import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeServiceDataService } from './kube-service-data.service';

const KUBE_GUID = 'kube-1';
const SERVICES_URL = '/pp/v1/proxy/api/v1/services?limit=500';
const ENDPOINTS_URL = '/pp/v1/proxy/api/v1/endpoints?limit=500';
const NS_SERVICES_URL = '/pp/v1/proxy/api/v1/namespaces/default/services?limit=500';

describe('KubeServiceDataService', () => {
  let svc: KubeServiceDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeServiceDataService,
      ],
    });
    svc = TestBed.inject(KubeServiceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('servicesInCluster + endpointsInCluster default to empty', () => {
    expect(svc.servicesInCluster(KUBE_GUID)()).toEqual([]);
    expect(svc.endpointsInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('refresh without namespace fetches both services and endpoints', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(SERVICES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'svc-a' } }, { metadata: { name: 'svc-b' } }] },
    });
    httpMock.expectOne(ENDPOINTS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'ep-a' } }] },
    });
    await refreshing;

    const services = svc.servicesInCluster(KUBE_GUID)();
    const endpoints = svc.endpointsInCluster(KUBE_GUID)();
    expect(services).toHaveLength(2);
    expect(services[0].kubeGuid).toBe(KUBE_GUID);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].metadata.kubeId).toBe(KUBE_GUID);
  });

  it('refresh with namespace fetches only namespaced services', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
    httpMock.expectOne(NS_SERVICES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'in-default' } }] },
    });
    await refreshing;

    expect(svc.servicesInNamespace(KUBE_GUID, 'default')()).toHaveLength(1);
    // Cluster cache untouched
    expect(svc.servicesInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('records UNAUTHORIZED on 403 service fetch', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(SERVICES_URL).flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(ENDPOINTS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await refreshing;

    const errs = svc.errors()();
    expect(errs.some(e => e.code === 'UNAUTHORIZED' && e.title === 'kube-services')).toBe(true);
  });

  it('keeps namespace caches isolated across (kubeGuid, namespace) tuples', async () => {
    const r1 = svc.refresh({ kubeGuid: 'kube-1', namespace: 'default' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/default/services?limit=500').flush({
      'kube-1': { items: [{ metadata: { name: 'a' } }] },
    });
    await r1;

    const r2 = svc.refresh({ kubeGuid: 'kube-1', namespace: 'kube-system' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/kube-system/services?limit=500').flush({
      'kube-1': { items: [{ metadata: { name: 'x' } }, { metadata: { name: 'y' } }] },
    });
    await r2;

    expect(svc.servicesInNamespace('kube-1', 'default')()).toHaveLength(1);
    expect(svc.servicesInNamespace('kube-1', 'kube-system')()).toHaveLength(2);
  });

  describe('workload scope', () => {
    it('setWorkloadServices stores services readable via servicesInWorkload, keyed by release', () => {
      const svc = TestBed.inject(KubeServiceDataService);
      expect(svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-x')()).toEqual([]);
      svc.setWorkloadServices('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 's1' } } as any]);
      const out = svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-x')();
      expect(out.length).toBe(1);
      expect(out[0].kubeGuid).toBe('cnsi-1');
      expect(out[0].metadata.kubeId).toBe('cnsi-1');
      expect(svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-y')()).toEqual([]);
    });
  });
});
