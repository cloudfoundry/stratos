import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { HelmReleaseVersionsSignalConfigService } from './helm-release-versions-signal-config.service';

const versionsUrl = (repo: string, chart: string) =>
  `/pp/v1/chartsvc/v1/charts/${repo}/${chart}/versions`;

const versionsPayload = {
  data: [
    { id: 'v1', attributes: { version: '4.16.0', created: '2024-03-03' } },
    { id: 'v2', attributes: { version: '4.16.0-rc.1', created: '2024-03-02' } },
    { id: 'v3', attributes: { version: '4.15.0', created: '2024-03-01' } },
  ],
};

describe('HelmReleaseVersionsSignalConfigService', () => {
  let svc: HelmReleaseVersionsSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        ChartsService,
        HelmReleaseVersionsSignalConfigService,
      ],
    });
    svc = TestBed.inject(HelmReleaseVersionsSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes core signals', () => {
    expect(svc.versionType).toBeDefined();
    expect(svc.selectedKey).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.filter).toBeDefined();
  });

  it('initialize wires up the view pipeline with no rows', () => {
    svc.initialize('bitnami', 'redis', '4.15.0', '');
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('loadAll fetches versions and the release filter hides pre-release builds', async () => {
    svc.initialize('bitnami', 'redis', '4.15.0', '');
    const loading = svc.loadAll();
    const req = httpMock.expectOne(versionsUrl('bitnami', 'redis'));
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe('');
    req.flush(versionsPayload);
    await loading;

    expect(svc.view.totalFilteredResults()).toBe(2);
    expect(svc.view.pagedItems().map(v => v.attributes.version)).toEqual(['4.16.0', '4.15.0']);
  });

  it('"all" version type surfaces pre-release builds too', async () => {
    svc.initialize('bitnami', 'redis', '4.15.0', '');
    const loading = svc.loadAll();
    httpMock.expectOne(versionsUrl('bitnami', 'redis')).flush(versionsPayload);
    await loading;

    svc.versionType.set('all');
    expect(svc.view.totalFilteredResults()).toBe(3);
    expect(svc.view.pagedItems().map(v => v.attributes.version)).toEqual([
      '4.16.0',
      '4.16.0-rc.1',
      '4.15.0',
    ]);
  });

  it('auto-selects the first non-development version on load', async () => {
    svc.initialize('bitnami', 'redis', '4.15.0', '');
    const loading = svc.loadAll();
    httpMock.expectOne(versionsUrl('bitnami', 'redis')).flush(versionsPayload);
    await loading;

    expect(svc.selectedKey()).toBe('4.16.0');
    expect(svc.selectedVersion()?.attributes.version).toBe('4.16.0');
  });

  it('getRowKey is the version string and isCurrent flags the running release', () => {
    svc.initialize('bitnami', 'redis', '4.15.0', '');
    const row = { id: 'v3', attributes: { version: '4.15.0', created: '2024-03-01' } } as any;
    expect(svc.getRowKey(row)).toBe('4.15.0');
    expect(svc.isCurrent(row)).toBe(true);
    expect(svc.isCurrent({ attributes: { version: '4.16.0' } } as any)).toBe(false);
  });

  it('passes a non-stratos endpoint through as the cnsi-list header', async () => {
    svc.initialize('hubrepo', 'nginx', '1.0.0', 'hub-endpoint-1');
    const loading = svc.loadAll();
    const req = httpMock.expectOne(versionsUrl('hubrepo', 'nginx'));
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe('hub-endpoint-1');
    req.flush({ data: [] });
    await loading;
    expect(svc.selectedKey()).toBeNull();
  });

  it('clearFilters resets the version type and page index', async () => {
    svc.initialize('bitnami', 'redis', '4.15.0', '');
    const loading = svc.loadAll();
    httpMock.expectOne(versionsUrl('bitnami', 'redis')).flush(versionsPayload);
    await loading;

    svc.versionType.set('all');
    svc.pageIndex.set(2);
    svc.clearFilters();
    expect(svc.versionType()).toBe('release');
    expect(svc.pageIndex()).toBe(0);
  });
});
