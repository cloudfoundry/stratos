import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KubernetesNamespacesSignalConfigService } from './kubernetes-namespaces-signal-config.service';

const KUBE_GUID = 'kube-1';
const VERSION_URL = '/pp/v1/proxy/version';
const NAMESPACES_URL = '/pp/v1/proxy/api/v1/namespaces?limit=500';
const NODES_URL = '/pp/v1/proxy/api/v1/nodes?limit=500';

describe('KubernetesNamespacesSignalConfigService', () => {
  let svc: KubernetesNamespacesSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeNamespaceDataService,
        KubernetesNamespacesSignalConfigService,
      ],
    });
    svc = TestBed.inject(KubernetesNamespacesSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes filter, sort, pageSize, pageIndex, nameFilter, viewMode signals', () => {
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
  });

  it('initialize wires up the view pipeline', () => {
    svc.initialize(KUBE_GUID);
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('loadAll triggers an endpoint load and populates the namespaces signal', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();

    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'default' } },
        { metadata: { name: 'kube-system' } },
      ] },
    });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });

    await loading;

    expect(svc.namespaces()).toHaveLength(2);
    expect(svc.view.pagedItems()).toHaveLength(2);
  });

  it('namespaces are filtered by nameFilter', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'default' } },
        { metadata: { name: 'kube-system' } },
      ] },
    });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loading;

    svc.nameFilter.set('system');
    // Allow effect to fire
    TestBed.tick();

    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].metadata.name).toBe('kube-system');
  });

  it('sorts by name asc / desc when the sort signal flips', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'b' } },
        { metadata: { name: 'a' } },
      ] },
    });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loading;

    expect(svc.view.pagedItems().map(n => n.metadata.name)).toEqual(['a', 'b']);

    svc.sort.set({ field: 'name', direction: 'desc' });
    expect(svc.view.pagedItems().map(n => n.metadata.name)).toEqual(['b', 'a']);
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

  it('initialize does not stack a filter effect on re-entry', () => {
    // Regression: this service is a root singleton, but the host tab calls
    // initialize() from its constructor on every mount. The filter effect
    // was created uncaptured, so each navigation left a live effect on the
    // root injector — N visits meant the filter predicate was recomputed N
    // times per keystroke. The fix captures the EffectRef and destroys the
    // prior one on re-entry.
    svc.initialize(KUBE_GUID);
    svc.initialize(KUBE_GUID);
    TestBed.tick();

    const setSpy = vi.spyOn(svc.filter, 'set');
    svc.nameFilter.set('abc');
    TestBed.tick();

    // One live effect → one filter recompute. Without the fix the two
    // stacked effects would each fire, yielding 2.
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it('refresh re-fetches namespaces only', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(VERSION_URL).flush({ [KUBE_GUID]: { gitVersion: 'v1.30.0' } });
    httpMock.expectOne(NAMESPACES_URL).flush({ [KUBE_GUID]: { items: [] } });
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loading;

    const refreshing = svc.refresh();
    httpMock.expectOne(NAMESPACES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'new-ns' } }] },
    });
    await refreshing;

    expect(svc.namespaces()).toHaveLength(1);
    expect(svc.namespaces()[0].metadata.name).toBe('new-ns');
  });
});
