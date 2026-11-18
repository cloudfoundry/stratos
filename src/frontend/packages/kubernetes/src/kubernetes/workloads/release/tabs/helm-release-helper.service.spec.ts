import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';
import { KubeHelmDataService } from '../../../../services/endpoint-data/kube-helm-data.service';
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

    it('release holds the loaded detail with a default icon, undefined before', async () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      expect(helper.release()).toBeUndefined();
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: { name: 'nginx' } } });
      await vi.waitFor(() => expect(helper.release()?.name).toBe('rel-x'));
      expect(helper.release()?.chart.metadata.icon).toBe('/kubernetes/assets/custom/app_placeholder.svg');
    });

    it('history() loads the revisions and exposes them as a signal', async () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: {} } });
      const history = helper.history();
      expect(history()).toBeUndefined();
      httpMock.expectOne(HISTORY_URL).flush({ revisions: [{ revision: 1 }, { revision: 2 }] });
      await vi.waitFor(() => expect(history()).toHaveLength(2));
    });

    it('graph and resources follow what the data service holds', () => {
      const helper = TestBed.inject(HelmReleaseHelperService);
      httpMock.expectOne(DETAIL_URL).flush({ name: 'rel-x', namespace: 'ns-a', chart: { metadata: {} } });
      expect(helper.graph()).toBeUndefined();
      expect(helper.resources()).toBeUndefined();

      releaseData.setGraph(RELEASE_GUID, { endpointId: 'cnsi-1', releaseTitle: 'rel-x', nodes: {}, links: {} } as HelmReleaseGraph);
      releaseData.setResources(RELEASE_GUID, { endpointId: 'cnsi-1', releaseTitle: 'rel-x', kind: 'Resources', data: [] } as HelmReleaseResources);

      expect(helper.graph()?.releaseTitle).toBe('rel-x');
      expect(helper.resources()?.kind).toBe('Resources');
    });

    describe('upgrade()', () => {
      const chart = (version: string) => ({
        attributes: { name: 'nginx', description: 'web server' },
        relationships: { latestChartVersion: { data: { version } } },
        monocularEndpointId: 'mono',
      });
      const releaseWith = (version: string) => ({
        name: 'rel-x', namespace: 'ns-a',
        chart: { metadata: { name: 'nginx', description: 'web server', version } },
      });

      function setup(charts: unknown[]) {
        vi.spyOn(TestBed.inject(KubeHelmDataService), 'monocularCharts').mockReturnValue(signal(charts) as never);
        vi.spyOn(TestBed.inject(KubeHelmDataService), 'loadCharts').mockResolvedValue(undefined as never);
        return TestBed.inject(HelmReleaseHelperService);
      }

      it('is null until the release has loaded', () => {
        const helper = setup([chart('2.0.0')]);
        const upgrade = helper.upgrade();
        httpMock.expectOne(DETAIL_URL);
        expect(upgrade()).toBeNull();
      });

      it('names the newer chart version once the release has loaded', async () => {
        const helper = setup([chart('2.0.0')]);
        const upgrade = helper.upgrade();
        httpMock.expectOne(DETAIL_URL).flush(releaseWith('1.0.0'));
        await vi.waitFor(() => expect(upgrade()?.version).toBe('2.0.0'));
      });

      it('is null when the release is current, unless the latest chart is asked for', async () => {
        const helper = setup([chart('1.0.0')]);
        const newer = helper.upgrade();
        const latest = helper.upgrade(true);
        httpMock.expectOne(DETAIL_URL).flush(releaseWith('1.0.0'));
        await vi.waitFor(() => expect(latest()?.version).toBe('1.0.0'));
        expect(newer()).toBeNull();
      });
    });
  });

  describe('chartStats', () => {
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
        ],
      }).compileComponents();
    });

    it('follows the workload pods as they change', () => {
      const pod = TestBed.inject(KubePodDataService);
      const stats = TestBed.inject(HelmReleaseHelperService).chartStats();
      expect(stats().podsChartData).toEqual([]);

      pod.setWorkloadPods('cnsi-1', 'ns-a', 'rel-x', [
        { metadata: { name: 'p1' }, status: { phase: 'Running', containerStatuses: [{ state: { running: {} } }] } } as any,
      ]);

      expect(stats().podsChartData.find(d => d.name === 'Running')?.value).toBe(1);
      expect(stats().containersChartData.find(d => d.name === 'Ready')?.value).toBe(1);
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
