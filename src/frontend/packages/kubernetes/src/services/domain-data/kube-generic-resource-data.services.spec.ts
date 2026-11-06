import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  KubeClusterRoleDataService,
  KubeConfigMapDataService,
  KubeDeploymentDataService,
  KubeJobDataService,
  KubePersistentVolumeClaimDataService,
  KubePersistentVolumeDataService,
  KubeReplicaSetDataService,
  KubeRoleDataService,
  KubeSecretDataService,
  KubeServiceAccountDataService,
  KubeStatefulSetDataService,
  KubeStorageClassDataService,
} from './kube-generic-resource-data.services';

const KUBE_GUID = 'kube-1';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  return TestBed.inject(HttpTestingController);
}

describe('KubeConfigMapDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeConfigMapDataService;

  beforeEach(() => {
    httpMock = setup();
    svc = TestBed.inject(KubeConfigMapDataService);
  });
  afterEach(() => httpMock.verify());

  it('itemsInCluster defaults to empty', () => {
    expect(svc.itemsInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('refresh without namespace fetches cluster-wide configmaps', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/configmaps?limit=500').flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'a' } }, { metadata: { name: 'b' } }] },
    });
    await refreshing;

    const items = svc.itemsInCluster(KUBE_GUID)();
    expect(items).toHaveLength(2);
    expect(items[0].kubeGuid).toBe(KUBE_GUID);
    expect(items[0].metadata?.kubeId).toBe(KUBE_GUID);
  });

  it('refresh with namespace fetches namespaced configmaps and isolates from cluster', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/default/configmaps?limit=500').flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'in-default' } }] },
    });
    await refreshing;

    expect(svc.itemsInNamespace(KUBE_GUID, 'default')()).toHaveLength(1);
    expect(svc.itemsInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('records UNAUTHORIZED on 403', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/configmaps?limit=500')
      .flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    await refreshing;

    const errs = svc.errors()();
    expect(errs.some(e => e.code === 'UNAUTHORIZED' && e.title === 'kube-configmaps')).toBe(true);
  });

  it('records FETCH_ERROR on 500', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/configmaps?limit=500')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    await refreshing;

    const errs = svc.errors()();
    expect(errs.some(e => e.code === 'FETCH_ERROR')).toBe(true);
  });
});

describe('KubeSecretDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeSecretDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeSecretDataService); });
  afterEach(() => httpMock.verify());

  it('uses /api/v1/secrets', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/secrets?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
    expect(svc.itemsInCluster(KUBE_GUID)()).toEqual([]);
  });
});

describe('KubeDeploymentDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeDeploymentDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeDeploymentDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/apps/v1/deployments', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/apps/v1/deployments?limit=500').flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'd1' }, spec: { replicas: 3 }, status: { readyReplicas: 2 } }] },
    });
    await r;
    expect(svc.itemsInCluster(KUBE_GUID)()).toHaveLength(1);
  });

  it('namespaced fetch hits /apis/apps/v1/namespaces/{ns}/deployments', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'kube-system' });
    httpMock.expectOne('/pp/v1/proxy/apis/apps/v1/namespaces/kube-system/deployments?limit=500')
      .flush({ [KUBE_GUID]: { items: [] } });
    await r;
    expect(svc.itemsInNamespace(KUBE_GUID, 'kube-system')()).toEqual([]);
  });
});

describe('KubeReplicaSetDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeReplicaSetDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeReplicaSetDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/apps/v1/replicasets', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/apps/v1/replicasets?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
    expect(svc.itemsInCluster(KUBE_GUID)()).toEqual([]);
  });
});

describe('KubeStatefulSetDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeStatefulSetDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeStatefulSetDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/apps/v1/statefulsets', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/apps/v1/statefulsets?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
    expect(svc.itemsInCluster(KUBE_GUID)()).toEqual([]);
  });
});

describe('KubePersistentVolumeDataService (cluster-only)', () => {
  let httpMock: HttpTestingController;
  let svc: KubePersistentVolumeDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubePersistentVolumeDataService); });
  afterEach(() => httpMock.verify());

  it('uses /api/v1/persistentvolumes', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/persistentvolumes?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
    expect(svc.itemsInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('refresh with namespace falls through to cluster fetch (cluster-only resource)', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/persistentvolumes?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });
});

describe('KubePersistentVolumeClaimDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubePersistentVolumeClaimDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubePersistentVolumeClaimDataService); });
  afterEach(() => httpMock.verify());

  it('uses /api/v1/persistentvolumeclaims for cluster fetch', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/persistentvolumeclaims?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });

  it('namespaced fetch hits /api/v1/namespaces/{ns}/persistentvolumeclaims', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/default/persistentvolumeclaims?limit=500')
      .flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });
});

describe('KubeStorageClassDataService (cluster-only)', () => {
  let httpMock: HttpTestingController;
  let svc: KubeStorageClassDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeStorageClassDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/storage.k8s.io/v1/storageclasses', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/storage.k8s.io/v1/storageclasses?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });
});

describe('KubeJobDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeJobDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeJobDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/batch/v1/jobs', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/batch/v1/jobs?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });
});

describe('KubeRoleDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeRoleDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeRoleDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/rbac.authorization.k8s.io/v1/roles', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/rbac.authorization.k8s.io/v1/roles?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });
});

describe('KubeClusterRoleDataService (cluster-only)', () => {
  let httpMock: HttpTestingController;
  let svc: KubeClusterRoleDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeClusterRoleDataService); });
  afterEach(() => httpMock.verify());

  it('uses /apis/rbac.authorization.k8s.io/v1/clusterroles', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/apis/rbac.authorization.k8s.io/v1/clusterroles?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });
});

describe('KubeServiceAccountDataService', () => {
  let httpMock: HttpTestingController;
  let svc: KubeServiceAccountDataService;
  beforeEach(() => { httpMock = setup(); svc = TestBed.inject(KubeServiceAccountDataService); });
  afterEach(() => httpMock.verify());

  it('uses /api/v1/serviceaccounts', async () => {
    const r = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne('/pp/v1/proxy/api/v1/serviceaccounts?limit=500').flush({ [KUBE_GUID]: { items: [] } });
    await r;
  });

  it('keeps namespace caches isolated across (kubeGuid, namespace) tuples', async () => {
    const r1 = svc.refresh({ kubeGuid: 'kube-1', namespace: 'default' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/default/serviceaccounts?limit=500').flush({
      'kube-1': { items: [{ metadata: { name: 'a' } }] },
    });
    await r1;

    const r2 = svc.refresh({ kubeGuid: 'kube-1', namespace: 'kube-system' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/kube-system/serviceaccounts?limit=500').flush({
      'kube-1': { items: [{ metadata: { name: 'x' } }, { metadata: { name: 'y' } }] },
    });
    await r2;

    expect(svc.itemsInNamespace('kube-1', 'default')()).toHaveLength(1);
    expect(svc.itemsInNamespace('kube-1', 'kube-system')()).toHaveLength(2);
  });
});
