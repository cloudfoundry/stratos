import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  KubeClusterRole,
  KubeConfigMap,
  KubeDeployment,
  KubeJob,
  KubePersistentVolume,
  KubePersistentVolumeClaim,
  KubeReplicaSet,
  KubeRole,
  KubeSecret,
  KubeServiceAccount,
  KubeStatefulSet,
  KubeStorageClass,
} from '../endpoint-data/kube-types';
import { KubeGenericResourceConfig, KubeGenericResourceDataServiceBase } from './kube-generic-resource-data.base';

// One thin subclass per generic-resource entity type. Each just plugs in
// the apiPath/resourceName/namespaced/title config — the base class
// handles caching, refresh, errors, and HTTP plumbing.
//
// API paths and namespacing are sourced from kubernetes-entity-generator.ts
// to stay in lock-step with the legacy entity catalog. Pluralization
// quirks: the entity-generator uses entity types `secrets` and
// `persistentVolumeClaims` already in plural (others singular).

@Injectable({ providedIn: 'root' })
export class KubeConfigMapDataService extends KubeGenericResourceDataServiceBase<KubeConfigMap> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1',
    resourceName: 'configmaps',
    namespaced: true,
    title: 'kube-configmaps',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeSecretDataService extends KubeGenericResourceDataServiceBase<KubeSecret> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1',
    resourceName: 'secrets',
    namespaced: true,
    title: 'kube-secrets',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeDeploymentDataService extends KubeGenericResourceDataServiceBase<KubeDeployment> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/apps/v1',
    resourceName: 'deployments',
    namespaced: true,
    title: 'kube-deployments',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeReplicaSetDataService extends KubeGenericResourceDataServiceBase<KubeReplicaSet> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/apps/v1',
    resourceName: 'replicasets',
    namespaced: true,
    title: 'kube-replicasets',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeStatefulSetDataService extends KubeGenericResourceDataServiceBase<KubeStatefulSet> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/apps/v1',
    resourceName: 'statefulsets',
    namespaced: true,
    title: 'kube-statefulsets',
  };
}

@Injectable({ providedIn: 'root' })
export class KubePersistentVolumeDataService extends KubeGenericResourceDataServiceBase<KubePersistentVolume> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1',
    resourceName: 'persistentvolumes',
    namespaced: false,
    title: 'kube-persistentvolumes',
  };
}

@Injectable({ providedIn: 'root' })
export class KubePersistentVolumeClaimDataService extends KubeGenericResourceDataServiceBase<KubePersistentVolumeClaim> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1',
    resourceName: 'persistentvolumeclaims',
    namespaced: true,
    title: 'kube-pvcs',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeStorageClassDataService extends KubeGenericResourceDataServiceBase<KubeStorageClass> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/storage.k8s.io/v1',
    resourceName: 'storageclasses',
    namespaced: false,
    title: 'kube-storageclasses',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeJobDataService extends KubeGenericResourceDataServiceBase<KubeJob> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/batch/v1',
    resourceName: 'jobs',
    namespaced: true,
    title: 'kube-jobs',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeRoleDataService extends KubeGenericResourceDataServiceBase<KubeRole> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/rbac.authorization.k8s.io/v1',
    resourceName: 'roles',
    namespaced: true,
    title: 'kube-roles',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeClusterRoleDataService extends KubeGenericResourceDataServiceBase<KubeClusterRole> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/apis/rbac.authorization.k8s.io/v1',
    resourceName: 'clusterroles',
    namespaced: false,
    title: 'kube-clusterroles',
  };
}

@Injectable({ providedIn: 'root' })
export class KubeServiceAccountDataService extends KubeGenericResourceDataServiceBase<KubeServiceAccount> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1',
    resourceName: 'serviceaccounts',
    namespaced: true,
    title: 'kube-serviceaccounts',
  };
}
