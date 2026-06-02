import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { CATALOGUE_ENTITIES } from '@stratosui/store';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { generateHelmEntities } from '../../../../helm/helm-entity-generator';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';
import { HelmReleaseDataService } from '../helm-release-data.service';
import { HelmReleaseGraph, HelmReleaseGuid, HelmReleaseResources } from '../../workload.types';
import { HelmReleaseHelperService, Version } from './helm-release-helper.service';

const RELEASE_GUID = 'cnsi-1:ns-a:rel-x';
const DETAIL_URL = '/pp/v1/helm/releases/cnsi-1/ns-a/rel-x';
const HISTORY_URL = '/pp/v1/helm/releases/cnsi-1/ns-a/rel-x/history';

describe('HelmReleaseHelperService', () => {

  describe('signal-backed release surfaces', () => {
    let httpMock: HttpTestingController;
    let releaseData: HelmReleaseDataService;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [...KubernetesBaseTestModules],
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          HelmReleaseHelperService,
          { provide: HelmReleaseGuid, useValue: { guid: RELEASE_GUID } },
        ],
      }).compileComponents();
      httpMock = TestBed.inject(HttpTestingController);
      releaseData = TestBed.inject(HelmReleaseDataService);
    });

    it('release$ emits the loaded detail with a default icon', async () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: { name: 'nginx' } } });
      const rel: any = await firstValueFrom(helper.release$);
      expect(rel.name).toBe('rel-x');
      expect(rel.chart.metadata.icon).toBe('/core/assets/custom/app_placeholder.svg');
    });

    it('fetchReleaseHistory loads and emits the revisions array', async () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: {} } });
      const history$ = helper.fetchReleaseHistory();
      httpMock.expectOne(HISTORY_URL).flush({ revisions: [{ revision: 1 }, { revision: 2 }] });
      const revs: any = await firstValueFrom(history$);
      expect(revs).toHaveLength(2);
    });

    it('fetchReleaseGraph emits graph written via the data service', async () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: {} } });
      const graph$ = helper.fetchReleaseGraph();
      releaseData.setGraph(RELEASE_GUID, { endpointId: 'cnsi-1', releaseTitle: 'rel-x', nodes: {}, links: {} } as HelmReleaseGraph);
      const graph: any = await firstValueFrom(graph$);
      expect(graph.releaseTitle).toBe('rel-x');
    });

    it('fetchReleaseResources emits resources written via the data service', async () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: {} } });
      const res$ = helper.fetchReleaseResources();
      releaseData.setResources(RELEASE_GUID, { endpointId: 'cnsi-1', releaseTitle: 'rel-x', kind: 'Resources', data: [] } as HelmReleaseResources);
      const res: any = await firstValueFrom(res$);
      expect(res.kind).toBe('Resources');
    });
  });

  describe('fetchReleaseChartStats', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [...KubernetesBaseTestModules],
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          HelmReleaseHelperService,
          { provide: HelmReleaseGuid, useValue: { guid: 'cnsi-1:ns-a:rel-x' } },
          {
            provide: CATALOGUE_ENTITIES,
            useFactory: () => generateHelmEntities(),
            multi: true,
          },
        ],
      }).compileComponents();
    });

    it('builds chart stats from the signal pod workload scope', async () => {
      const pod = TestBed.inject(KubePodDataService);
      const helper = TestBed.inject(HelmReleaseHelperService);
      helper.endpointGuid = 'cnsi-1'; helper.namespace = 'ns-a'; helper.releaseTitle = 'rel-x';
      pod.setWorkloadPods('cnsi-1', 'ns-a', 'rel-x', [
        { metadata: { name: 'p1' }, status: { phase: 'Running', containerStatuses: [{ state: { running: {} } }] } } as any,
      ]);
      const data = await firstValueFrom(helper.fetchReleaseChartStats());
      expect(data.podsChartData.find(d => d.name === 'Running')?.value).toBe(1);
      expect(data.containersChartData.find(d => d.name === 'Ready')?.value).toBe(1);
    });
  });

  describe('Version', () => {

    const v10 = new Version('1.0.0');
    const v11 = new Version('1.1.0');
    const v11rc1 = new Version('1.0.0-rc.1');
    const v11rc2 = new Version('1.0.0-rc.2');
    const v201 = new Version('2.0.1');
    const v101 = new Version('1.0.1');

    it('version comparisons', () => {
      expect(v11.isNewer(v10)).toBe(true);
      expect(v11rc1.isNewer(v11)).toBe(false);
      expect(v11rc2.isNewer(v11rc1)).toBe(true);
      expect(v201.isNewer(v11)).toBe(true);
      expect(v201.isNewer(v11rc1)).toBe(true);
      expect(v10.isNewer(v11)).toBe(false);
      expect(v101.isNewer(v11)).toBe(false);
      expect(v101.isNewer(v10)).toBe(true);

      expect(v11rc1.isNewer(v10)).toBe(false);

    });
  });
});
