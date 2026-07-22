import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KubeHelmDataService } from '../../services/endpoint-data/kube-helm-data.service';
import { MonocularChartsSignalConfigService } from './monocular-charts-signal-config.service';

const CHARTS_URL = '/pp/v1/chartsvc/v1/charts';

const chartsPayload = {
  data: [
    { id: 'c1', attributes: { name: 'nginx', description: 'web server', repo: { name: 'bitnami' } } },
    { id: 'c2', attributes: { name: 'redis', description: 'kv store', repo: { name: 'bitnami' } } },
    { id: 'c3', attributes: { name: 'postgres', description: 'sql', repo: { name: 'hub-repo' } }, monocularEndpointId: 'hub-1' },
  ],
};

describe('MonocularChartsSignalConfigService', () => {
  let svc: MonocularChartsSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeHelmDataService,
        MonocularChartsSignalConfigService,
      ],
    });
    svc = TestBed.inject(MonocularChartsSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes core signals', () => {
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
    expect(svc.repositoryFilter).toBeDefined();
  });

  it('initialize wires up the view pipeline', () => {
    svc.initialize();
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  it('refresh fetches charts and populates the view', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(CHARTS_URL).flush(chartsPayload);
    await loading;
    expect(svc.view.pagedItems()).toHaveLength(3);
  });

  it('filters by nameFilter', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(CHARTS_URL).flush(chartsPayload);
    await loading;
    svc.nameFilter.set('nginx');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].name).toBe('nginx');
  });

  it('filters by exact repository', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(CHARTS_URL).flush(chartsPayload);
    await loading;
    svc.repositoryFilter.set('bitnami');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(2);
  });

  it('Artifact Hub filter selects only hub-sourced charts', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(CHARTS_URL).flush(chartsPayload);
    await loading;
    svc.repositoryFilter.set('Artifact Hub');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].name).toBe('postgres');
  });

  it('exposes sorted unique repo lists', async () => {
    svc.initialize();
    const loading = svc.refresh();
    httpMock.expectOne(CHARTS_URL).flush(chartsPayload);
    await loading;
    expect(svc.stratosRepos()).toEqual(['bitnami']);
    expect(svc.artifactHubRepos()).toEqual(['hub-repo']);
  });

  it('clearFilters resets state', () => {
    svc.initialize();
    svc.nameFilter.set('foo');
    svc.repositoryFilter.set('bitnami');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(2);
    svc.clearFilters();
    expect(svc.nameFilter()).toBe('');
    expect(svc.repositoryFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });
});
