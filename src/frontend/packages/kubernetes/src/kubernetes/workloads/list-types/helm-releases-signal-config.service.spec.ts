import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KubeHelmDataService } from '../../../services/endpoint-data/kube-helm-data.service';
import { HelmReleasesSignalConfigService } from './helm-releases-signal-config.service';

const RELEASES_URL = '/pp/v1/helm/releases';

const releasesPayload = {
  'kube-1': [
    { name: 'rel-a', namespace: 'ns1', info: { status: 'deployed' }, chart: { metadata: { version: '1.0.0' } } },
    { name: 'rel-c', namespace: 'ns3', info: { status: 'failed' }, chart: { metadata: { version: '0.5.0' } } },
  ],
  'kube-2': [
    { name: 'rel-b', namespace: 'ns2', info: { status: 'deployed' }, chart: { metadata: { version: '2.0.0' } } },
  ],
};

describe('HelmReleasesSignalConfigService', () => {
  let svc: HelmReleasesSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeHelmDataService,
        HelmReleasesSignalConfigService,
      ],
    });
    svc = TestBed.inject(HelmReleasesSignalConfigService);
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
    svc.initialize();
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('refresh triggers the helm releases fetch and populates the signal', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(RELEASES_URL).flush(releasesPayload);
    await loading;
    expect(svc.view.pagedItems()).toHaveLength(3);
  });

  it('filters by nameFilter', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(RELEASES_URL).flush(releasesPayload);
    await loading;
    svc.nameFilter.set('rel-a');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].name).toBe('rel-a');
  });

  it('filters by kubeId and namespace', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(RELEASES_URL).flush(releasesPayload);
    await loading;

    svc.kubeIdFilter.set('kube-1');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(2);

    svc.namespaceFilter.set('ns3');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].name).toBe('rel-c');
  });

  it('sorts by name asc / desc when the sort signal flips', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(RELEASES_URL).flush(releasesPayload);
    await loading;
    expect(svc.view.pagedItems().map(r => r.name)).toEqual(['rel-a', 'rel-b', 'rel-c']);
    svc.sort.set({ field: 'name', direction: 'desc' });
    expect(svc.view.pagedItems().map(r => r.name)).toEqual(['rel-c', 'rel-b', 'rel-a']);
  });

  it('clearFilters resets filters + sort + pageIndex', () => {
    svc.initialize();
    svc.nameFilter.set('foo');
    svc.kubeIdFilter.set('kube-1');
    svc.namespaceFilter.set('ns');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(2);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.kubeIdFilter()).toBe('');
    expect(svc.namespaceFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });
});
