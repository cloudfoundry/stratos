import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeServiceDataService } from '../../../services/domain-data/kube-service-data.service';
import { KubernetesServicesSignalConfigService } from './kubernetes-services-signal-config.service';

const KUBE_GUID = 'kube-1';
const SERVICES_URL = '/pp/v1/proxy/api/v1/services?limit=500';
const ENDPOINTS_URL = '/pp/v1/proxy/api/v1/endpoints?limit=500';

describe('KubernetesServicesSignalConfigService', () => {
  let svc: KubernetesServicesSignalConfigService;
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
        KubernetesServicesSignalConfigService,
      ],
    });
    svc = TestBed.inject(KubernetesServicesSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes the standard signal-config surface', () => {
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
  });

  it('initialize wires the view pipeline', () => {
    svc.initialize(KUBE_GUID);
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('loadAll fetches both services and endpoints (cluster-wide)', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(SERVICES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'svc-a' } },
        { metadata: { name: 'svc-b' } },
      ] },
    });
    httpMock.expectOne(ENDPOINTS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'ep-a' } }] },
    });
    await loading;

    expect(svc.services()).toHaveLength(2);
    expect(svc.view.pagedItems()).toHaveLength(2);
  });

  it('services are filtered by nameFilter', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(SERVICES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'kubernetes' } },
        { metadata: { name: 'kube-dns' } },
        { metadata: { name: 'metrics-server' } },
      ] },
    });
    httpMock.expectOne(ENDPOINTS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loading;

    svc.nameFilter.set('kube');
    TestBed.tick();

    expect(svc.view.pagedItems().map(s => s.metadata.name).sort()).toEqual(['kube-dns', 'kubernetes']);
  });

  it('sort flips between asc and desc by name', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(SERVICES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'b' } },
        { metadata: { name: 'a' } },
      ] },
    });
    httpMock.expectOne(ENDPOINTS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loading;

    expect(svc.view.pagedItems().map(s => s.metadata.name)).toEqual(['a', 'b']);

    svc.sort.set({ field: 'name', direction: 'desc' });
    expect(svc.view.pagedItems().map(s => s.metadata.name)).toEqual(['b', 'a']);
  });

  it('clearFilters resets nameFilter, sort, pageIndex', () => {
    svc.initialize(KUBE_GUID);
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(2);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });
});
