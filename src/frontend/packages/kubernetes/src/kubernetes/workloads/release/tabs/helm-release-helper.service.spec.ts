import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { CATALOGUE_ENTITIES } from '@stratosui/store';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { generateHelmEntities } from '../../../../helm/helm-entity-generator';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';
import { HelmReleaseGuid } from '../../workload.types';
import { HelmReleaseHelperService, Version } from './helm-release-helper.service';

describe('HelmReleaseHelperService', () => {

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
