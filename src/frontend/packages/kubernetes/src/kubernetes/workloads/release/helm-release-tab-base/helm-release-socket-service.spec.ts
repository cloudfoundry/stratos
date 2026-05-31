import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  KubeJobDataService, KubePersistentVolumeClaimDataService, KubeReplicaSetDataService,
  KubeRoleDataService, KubeSecretDataService, KubeServiceAccountDataService,
} from '../../../../services/domain-data/kube-generic-resource-data.services';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../../../services/domain-data/kube-service-data.service';
import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';
import { HelmReleaseSocketService } from './helm-release-socket-service';

// Minimal stub for HelmReleaseHelperService — only the fields read by
// HelmReleaseSocketService.writeManifestResources are needed.
const stubHelper = {
  endpointGuid: 'cnsi-1',
  namespace: 'ns-a',
  releaseTitle: 'rel-x',
};

describe('HelmReleaseSocketService.writeManifestResources', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        HelmReleaseSocketService,
        { provide: HelmReleaseHelperService, useValue: stubHelper },
        // Store stub — only dispatch() is called (via addResource in the socket path)
        { provide: Store, useValue: { dispatch: () => {} } },
        // SnackBarService stub
        { provide: SnackBarService, useValue: { show: () => {}, hide: () => {} } },
      ],
    });
  });

  it('routes manifest resource groups to the matching signal data service', () => {
    const pod = TestBed.inject(KubePodDataService);
    const svc = TestBed.inject(KubeServiceDataService);
    const socket = TestBed.inject(HelmReleaseSocketService);

    (socket as any).writeManifestResources({
      pod: [{ metadata: { name: 'p1' }, status: { phase: 'Running' } } as any],
      service: [{ metadata: { name: 's1' } } as any],
    });

    expect(pod.podsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
    expect(svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
  });

  it('routes all generic resource types to their matching signal data services', () => {
    const job = TestBed.inject(KubeJobDataService);
    const secret = TestBed.inject(KubeSecretDataService);
    const pvc = TestBed.inject(KubePersistentVolumeClaimDataService);
    const replicaSet = TestBed.inject(KubeReplicaSetDataService);
    const role = TestBed.inject(KubeRoleDataService);
    const serviceAccount = TestBed.inject(KubeServiceAccountDataService);
    const socket = TestBed.inject(HelmReleaseSocketService);

    (socket as any).writeManifestResources({
      job: [{ metadata: { name: 'j1' } } as any],
      secrets: [{ metadata: { name: 'sec1' } } as any],
      pvc: [{ metadata: { name: 'pvc1' } } as any],
      replicaSet: [{ metadata: { name: 'rs1' } } as any],
      role: [{ metadata: { name: 'r1' } } as any],
      serviceAccount: [{ metadata: { name: 'sa1' } } as any],
    });

    expect(job.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
    expect(secret.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
    expect(pvc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
    expect(replicaSet.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
    expect(role.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
    expect(serviceAccount.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(1);
  });

  it('handles empty list gracefully — writes zero items', () => {
    const pod = TestBed.inject(KubePodDataService);
    const socket = TestBed.inject(HelmReleaseSocketService);

    (socket as any).writeManifestResources({ pod: [] });

    expect(pod.podsInWorkload('cnsi-1', 'ns-a', 'rel-x')().length).toBe(0);
  });

  it('normalizes pod kubeGuid and kubeId metadata', () => {
    const pod = TestBed.inject(KubePodDataService);
    const socket = TestBed.inject(HelmReleaseSocketService);

    (socket as any).writeManifestResources({
      pod: [{ metadata: { name: 'p1' }, status: { phase: 'Running' } } as any],
    });

    const pods = pod.podsInWorkload('cnsi-1', 'ns-a', 'rel-x')();
    expect(pods[0].kubeGuid).toBe('cnsi-1');
    expect(pods[0].metadata.kubeId).toBe('cnsi-1');
  });
});
