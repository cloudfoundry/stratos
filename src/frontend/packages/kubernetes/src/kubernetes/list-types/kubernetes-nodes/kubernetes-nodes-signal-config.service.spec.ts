import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeNodeDataService } from '../../../services/domain-data/kube-node-data.service';
import { KubernetesNodesSignalConfigService } from './kubernetes-nodes-signal-config.service';

const KUBE_GUID = 'kube-1';
const NODES_URL = '/pp/v1/proxy/api/v1/nodes?limit=500';

describe('KubernetesNodesSignalConfigService', () => {
  let svc: KubernetesNodesSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeNodeDataService,
        KubernetesNodesSignalConfigService,
      ],
    });
    svc = TestBed.inject(KubernetesNodesSignalConfigService);
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

  it('loadAll fetches nodes and exposes them via the view', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(NODES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'node-a' } },
        { metadata: { name: 'node-b' } },
      ] },
    });
    await loading;

    expect(svc.nodes()).toHaveLength(2);
    expect(svc.view.pagedItems()).toHaveLength(2);
  });

  it('nodes are filtered by nameFilter', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(NODES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'node-a' } },
        { metadata: { name: 'node-b' } },
        { metadata: { name: 'master' } },
      ] },
    });
    await loading;

    svc.nameFilter.set('node');
    TestBed.tick();

    expect(svc.view.pagedItems().map(n => n.metadata.name).sort()).toEqual(['node-a', 'node-b']);
  });

  it('sort flips between asc and desc by name', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(NODES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'b' } },
        { metadata: { name: 'a' } },
      ] },
    });
    await loading;

    expect(svc.view.pagedItems().map(n => n.metadata.name)).toEqual(['a', 'b']);

    svc.sort.set({ field: 'name', direction: 'desc' });
    expect(svc.view.pagedItems().map(n => n.metadata.name)).toEqual(['b', 'a']);
  });

  it('clearFilters resets nameFilter, sort, pageIndex', () => {
    svc.initialize(KUBE_GUID);
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(3);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });

  it('refresh re-fetches nodes', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    await loading;

    const refreshing = svc.refresh();
    httpMock.expectOne(NODES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'new-node' } }] },
    });
    await refreshing;

    expect(svc.nodes()).toHaveLength(1);
    expect(svc.nodes()[0].metadata.name).toBe('new-node');
  });
});
