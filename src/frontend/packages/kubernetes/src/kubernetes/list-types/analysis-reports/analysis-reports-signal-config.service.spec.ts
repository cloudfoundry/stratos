import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeAnalysisDataService } from '../../../services/domain-data/kube-analysis-data.service';
import { AnalysisReportsSignalConfigService } from './analysis-reports-signal-config.service';

const KUBE_GUID = 'kube-1';
const REPORTS_URL = `/pp/v1/analysis/reports/${KUBE_GUID}`;

describe('AnalysisReportsSignalConfigService', () => {
  let svc: AnalysisReportsSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeAnalysisDataService,
        AnalysisReportsSignalConfigService,
      ],
    });
    svc = TestBed.inject(AnalysisReportsSignalConfigService);
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

  it('loadAll fetches reports and populates the signal pipeline', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(REPORTS_URL).flush([
      { id: 'r1', name: 'Alpha', type: 'popeye', status: 'completed' },
      { id: 'r2', name: 'Beta', type: 'kubescore', status: 'pending' },
    ]);
    await loading;

    expect(svc.reports()).toHaveLength(2);
    expect(svc.view.pagedItems()).toHaveLength(2);
  });

  it('reports are filtered by nameFilter', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(REPORTS_URL).flush([
      { id: 'r1', name: 'Alpha', type: 'popeye', status: 'completed' },
      { id: 'r2', name: 'Beta', type: 'kubescore', status: 'pending' },
    ]);
    await loading;

    svc.nameFilter.set('beta');
    TestBed.tick();

    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].name).toBe('Beta');
  });

  it('sorts by name asc / desc when the sort signal flips', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(REPORTS_URL).flush([
      { id: 'r2', name: 'Beta', type: 'popeye', status: 'completed' },
      { id: 'r1', name: 'Alpha', type: 'popeye', status: 'completed' },
    ]);
    await loading;

    expect(svc.view.pagedItems().map(r => r.name)).toEqual(['Alpha', 'Beta']);

    svc.sort.set({ field: 'name', direction: 'desc' });
    expect(svc.view.pagedItems().map(r => r.name)).toEqual(['Beta', 'Alpha']);
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

  it('refresh re-fetches the report list', async () => {
    svc.initialize(KUBE_GUID);
    const loading = svc.loadAll();
    httpMock.expectOne(REPORTS_URL).flush([]);
    await loading;

    const refreshing = svc.refresh();
    httpMock.expectOne(REPORTS_URL).flush([
      { id: 'r1', name: 'New', type: 'popeye', status: 'completed' },
    ]);
    await refreshing;

    expect(svc.reports()).toHaveLength(1);
    expect(svc.reports()[0].name).toBe('New');
  });
});
