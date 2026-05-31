import {
  Injector,
  Signal,
  WritableSignal,
  computed,
  effect,
  runInInjectionContext,
  signal,
} from '@angular/core';

import { ListStateStore, SignalListConfig, SignalListSort } from '@stratosui/core';

import { KubeGenericResourceDataServiceBase } from '../../services/domain-data/kube-generic-resource-data.base';
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
} from '../../services/domain-data/kube-generic-resource-data.services';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../services/domain-data/kube-service-data.service';
import {
  KubeClusterRole,
  KubeConfigMap,
  KubeDeployment,
  KubeJob,
  KubeNamespace,
  KubePersistentVolume,
  KubePersistentVolumeClaim,
  KubePod,
  KubeReplicaSet,
  KubeRole,
  KubeSecret,
  KubeService,
  KubeServiceAccount,
  KubeStatefulSet,
  KubeStorageClass,
  StratosError,
} from '../../services/endpoint-data/kube-types';
import { KubeSortSpec, KubeViewPipeline } from '../list-types/kube-view-pipeline';
import { KubernetesSignalConfigContext } from './kubernetes-signal-config-registry';

// Lightweight age formatter matching the wave-2 signal-list pages (see
// kubernetes-namespaces-tab.component.ts). Intentionally inline to avoid
// pulling the legacy `createKubeAgeColumn` helper which depends on the
// store/ types tree wave-3 will delete.
function formatAge(iso?: string): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

// Convert a partial map of sort extractors + filter predicate into a
// SignalListConfig — handles the (filter → sort → page) pipeline so each
// per-entity factory can stay focused on column wiring.
//
// `dataSignal` is a Signal<T[]> that re-emits when the underlying data
// service updates. `nameFilter` and `sort` are WritableSignals so the
// signal-list toolbar can drive them directly.
function buildSignalListConfig<T extends { metadata?: { name?: string } }>(
  injector: Injector,
  stateKey: string,
  dataSignal: Signal<T[]>,
  sortExtractors: Map<string, (row: T) => unknown>,
  columns: SignalListConfig<T>['columns'],
  getRowKey: (row: T) => string,
  emptyMessage: string,
  emptyFilterMessage: string,
  loadingMessage: string,
  refresh: (() => Promise<void>) | undefined,
  errors: Signal<StratosError[]>,
  isLoading: Signal<boolean>,
): SignalListConfig<T> {
  const stateStore = injector.get(ListStateStore);
  const state = stateStore.bind(stateKey, {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  const filter: WritableSignal<(row: T) => boolean> = signal(() => true);
  const nameFilter: WritableSignal<string> = signal('');
  const sort = state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<T>>;
  const sortExtractorsSig = signal(sortExtractors).asReadonly();

  const view = new KubeViewPipeline<T>(
    dataSignal,
    filter,
    sort,
    state.pageSize,
    state.pageIndex,
    sortExtractorsSig,
  );

  // Wire nameFilter → filter predicate. Mirror the wave-2 pages: a
  // case-insensitive substring match against metadata.name.
  runInInjectionContext(injector, () => {
    effect(() => {
      const q = nameFilter().trim().toLowerCase();
      filter.set((row: T) => {
        if (!q) return true;
        return (row.metadata?.name ?? '').toLowerCase().includes(q);
      });
    });

    // Reset pageIndex whenever the filter narrows results to fewer pages
    // than the current index — same UX guard the dedicated tabs ship.
    effect(() => {
      const total = view.totalPages();
      if (state.pageIndex() >= total) {
        state.pageIndex.set(0);
      }
    });
  });

  return {
    pagedItems: view.pagedItems,
    totalFilteredResults: view.totalFilteredResults,
    totalPages: view.totalPages,
    pageIndex: state.pageIndex,
    pageSize: state.pageSize,
    isAnyLoading: isLoading,
    errorsByCnsi: computed(() => {
      const map = new Map<string, unknown>();
      const errs = errors();
      if (errs.length) {
        // Group all errors under the first affected guid (or 'unknown').
        const guid = errs[0]?.affected?.[0] ?? 'unknown';
        map.set(guid, errs);
      }
      return map;
    }),
    columns,
    getRowKey,
    emptyMessage,
    emptyFilterMessage,
    loadingMessage,
    pageSizeOptions: { table: [10, 25, 50, 100], card: [6, 12, 24, 48, 96] },
    nameFilter,
    onRefresh: refresh ? () => refresh() : undefined,
    onClear: () => {
      nameFilter.set('');
      sort.set({ field: 'name', direction: 'asc' });
      state.pageIndex.set(0);
    },
    viewMode: state.viewMode,
    sort,
  };
}

// Factory: Pods (entity type `pod` in kubeEntityCatalog). Switches
// between `podsInCluster` and `podsInNamespace` based on the namespace
// dropdown selection. Mirrors the legacy KubernetesPodsListConfig
// columns: Name, Namespace, Node, Status, Restarts, Age.
export function buildPodsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubePod> {
  const podData = injector.get(KubePodDataService);

  // The data signal switches between workload scope (socket-pushed) and
  // cluster/namespace scope (REST-fetched) based on ctx.isWorkloadView.
  // computed() over selectedNamespace re-evaluates and re-binds to a
  // new podsInCluster/podsInNamespace projection.
  const dataSignal = computed<KubePod[]>(() => {
    if (ctx.isWorkloadView) {
      return podData.podsInWorkload(ctx.kubeGuid, ctx.workloadNamespace as string, ctx.workloadTitle as string)();
    }
    const ns = ctx.selectedNamespace();
    const pods = ns
      ? podData.podsInNamespace(ctx.kubeGuid, ns)
      : podData.podsInCluster(ctx.kubeGuid);
    return pods();
  });

  const sortExtractors = new Map<string, (row: KubePod) => unknown>([
    ['name', (p: KubePod) => (p.metadata?.name ?? '').toLowerCase()],
    ['namespace', (p: KubePod) => (p.metadata?.namespace ?? '').toLowerCase()],
    ['node', (p: KubePod) => (p.spec?.nodeName ?? '').toLowerCase()],
    ['status', (p: KubePod) => p.expandedStatus?.status ?? ''],
    ['restarts', (p: KubePod) => p.expandedStatus?.restarts ?? 0],
    ['age', (p: KubePod) => p.metadata?.creationTimestamp ?? ''],
  ]);

  const columns: SignalListConfig<KubePod>['columns'] = [
    {
      header: 'Name', key: 'name', kind: 'text',
      sortField: (p: KubePod) => (p.metadata?.name ?? '').toLowerCase(),
      render: (p: KubePod) => p.metadata?.name ?? '',
      widthHint: '24rem',
    },
    {
      header: 'Namespace', key: 'namespace', kind: 'link',
      sortField: (p: KubePod) => (p.metadata?.namespace ?? '').toLowerCase(),
      link: (p: KubePod) => p.metadata?.namespace
        ? ['/kubernetes', p.metadata?.kubeId ?? p.kubeGuid, 'namespaces', p.metadata.namespace]
        : null,
      render: (p: KubePod) => p.metadata?.namespace ?? '',
      widthHint: '12rem',
    },
    {
      header: 'Node', key: 'node', kind: 'link',
      sortField: (p: KubePod) => (p.spec?.nodeName ?? '').toLowerCase(),
      link: (p: KubePod) => p.spec?.nodeName
        ? ['/kubernetes', p.metadata?.kubeId ?? p.kubeGuid, 'nodes', p.spec.nodeName, 'summary']
        : null,
      render: (p: KubePod) => p.spec?.nodeName ?? '',
      widthHint: '12rem',
    },
    {
      header: 'Status', key: 'status', kind: 'text',
      sortField: (p: KubePod) => p.expandedStatus?.status ?? '',
      render: (p: KubePod) => p.expandedStatus?.status ?? '',
      widthHint: '10rem',
    },
    {
      header: 'Restarts', key: 'restarts', kind: 'text',
      sortField: (p: KubePod) => p.expandedStatus?.restarts ?? 0,
      render: (p: KubePod) => String(p.expandedStatus?.restarts ?? 0),
      widthHint: '6rem',
    },
    {
      header: 'Age', key: 'age', kind: 'text',
      sortField: (p: KubePod) => p.metadata?.creationTimestamp ?? '',
      render: (p: KubePod) => formatAge(p.metadata?.creationTimestamp),
      widthHint: '8rem',
    },
  ];

  return buildSignalListConfig<KubePod>(
    injector,
    'kube-resource-pods',
    dataSignal,
    sortExtractors,
    columns,
    (p: KubePod) => `${p.kubeGuid}:${p.metadata?.namespace ?? ''}:${p.metadata?.name ?? ''}`,
    'There are no pods',
    'No pods match the current filter',
    'Loading pods…',
    ctx.isWorkloadView ? undefined : () => podData.refresh({ kubeGuid: ctx.kubeGuid }),
    podData.errors(),
    signal(false).asReadonly(),
  );
}

// Factory: Services (entity type `service` in kubeEntityCatalog). Same
// shape as pods — switches cluster/namespace mode via the dropdown.
export function buildServicesSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeService> {
  const serviceData = injector.get(KubeServiceDataService);

  const dataSignal = computed<KubeService[]>(() => {
    if (ctx.isWorkloadView) {
      return serviceData.servicesInWorkload(ctx.kubeGuid, ctx.workloadNamespace as string, ctx.workloadTitle as string)();
    }
    const ns = ctx.selectedNamespace();
    const services = ns
      ? serviceData.servicesInNamespace(ctx.kubeGuid, ns)
      : serviceData.servicesInCluster(ctx.kubeGuid);
    return services();
  });

  const sortExtractors = new Map<string, (row: KubeService) => unknown>([
    ['name', (s: KubeService) => (s.metadata?.name ?? '').toLowerCase()],
    ['namespace', (s: KubeService) => (s.metadata?.namespace ?? '').toLowerCase()],
    ['clusterIp', (s: KubeService) => s.spec?.clusterIP ?? ''],
    ['portType', (s: KubeService) => s.spec?.type ?? ''],
    ['age', (s: KubeService) => s.metadata?.creationTimestamp ?? ''],
  ]);

  const columns: SignalListConfig<KubeService>['columns'] = [
    {
      header: 'Name', key: 'name', kind: 'text',
      sortField: (s: KubeService) => (s.metadata?.name ?? '').toLowerCase(),
      render: (s: KubeService) => s.metadata?.name ?? '',
      widthHint: '24rem',
    },
    {
      header: 'Namespace', key: 'namespace', kind: 'link',
      sortField: (s: KubeService) => (s.metadata?.namespace ?? '').toLowerCase(),
      link: (s: KubeService) => s.metadata?.namespace
        ? ['/kubernetes', s.metadata?.kubeId ?? s.kubeGuid, 'namespaces', s.metadata.namespace]
        : null,
      render: (s: KubeService) => s.metadata?.namespace ?? '',
      widthHint: '12rem',
    },
    {
      header: 'Cluster IP', key: 'clusterIp', kind: 'text',
      sortField: (s: KubeService) => s.spec?.clusterIP ?? '',
      render: (s: KubeService) => s.spec?.clusterIP ?? '',
      widthHint: '10rem',
    },
    {
      header: 'Port Type', key: 'portType', kind: 'text',
      sortField: (s: KubeService) => s.spec?.type ?? '',
      render: (s: KubeService) => s.spec?.type ?? '',
      widthHint: '8rem',
    },
    {
      header: 'Ports', key: 'ports', kind: 'text',
      render: (s: KubeService) => (s.spec?.ports ?? [])
        .map(p => `${p.port}${p.protocol ? '/' + p.protocol : ''}`)
        .join(', '),
      widthHint: '12rem',
    },
    {
      header: 'Age', key: 'age', kind: 'text',
      sortField: (s: KubeService) => s.metadata?.creationTimestamp ?? '',
      render: (s: KubeService) => formatAge(s.metadata?.creationTimestamp),
      widthHint: '8rem',
    },
  ];

  return buildSignalListConfig<KubeService>(
    injector,
    'kube-resource-services',
    dataSignal,
    sortExtractors,
    columns,
    (s: KubeService) => `${s.kubeGuid}:${s.metadata?.namespace ?? ''}:${s.metadata?.name ?? ''}`,
    'There are no services',
    'No services match the current filter',
    'Loading services…',
    ctx.isWorkloadView ? undefined : () => serviceData.refresh({ kubeGuid: ctx.kubeGuid }),
    serviceData.errors(),
    signal(false).asReadonly(),
  );
}

// Factory: Namespaces (entity type `namespace` in kubeEntityCatalog).
// Cluster-scoped — namespace dropdown is hidden by the shell when the
// current entity isn't apiNamespaced.
export function buildNamespacesSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeNamespace> {
  const namespaceData = injector.get(KubeNamespaceDataService);
  const dataSignal = namespaceData.namespacesForEndpoint(ctx.kubeGuid);

  const sortExtractors = new Map<string, (row: KubeNamespace) => unknown>([
    ['name', (n: KubeNamespace) => (n.metadata?.name ?? '').toLowerCase()],
    ['status', (n: KubeNamespace) => n.status?.phase ?? ''],
    ['age', (n: KubeNamespace) => n.metadata?.creationTimestamp ?? ''],
  ]);

  const columns: SignalListConfig<KubeNamespace>['columns'] = [
    {
      header: 'Name', key: 'name', kind: 'link',
      sortField: (n: KubeNamespace) => (n.metadata?.name ?? '').toLowerCase(),
      link: (n: KubeNamespace) =>
        ['/kubernetes', n.metadata?.kubeId ?? n.kubeGuid, 'namespaces', n.metadata?.name ?? ''],
      render: (n: KubeNamespace) => n.metadata?.name ?? '',
      widthHint: '24rem',
    },
    {
      header: 'Status', key: 'status', kind: 'text',
      sortField: (n: KubeNamespace) => n.status?.phase ?? '',
      render: (n: KubeNamespace) => n.status?.phase ?? '',
      widthHint: '10rem',
    },
    {
      header: 'Age', key: 'age', kind: 'text',
      sortField: (n: KubeNamespace) => n.metadata?.creationTimestamp ?? '',
      render: (n: KubeNamespace) => formatAge(n.metadata?.creationTimestamp),
      widthHint: '10rem',
    },
  ];

  return buildSignalListConfig<KubeNamespace>(
    injector,
    'kube-resource-namespaces',
    dataSignal,
    sortExtractors,
    columns,
    (n: KubeNamespace) => `${n.kubeGuid}:${n.metadata?.name ?? ''}`,
    'There are no namespaces',
    'No namespaces match the current filter',
    'Loading namespaces…',
    () => namespaceData.refresh({ kubeGuid: ctx.kubeGuid }),
    namespaceData.errors(),
    signal(false).asReadonly(),
  );
}

// ---------------------------------------------------------------------------
// Wave-3 generic-resource factories
// ---------------------------------------------------------------------------
// Each factory mirrors buildServicesSignalConfig — eager-refresh data
// service, namespace dropdown switches between cluster/namespace fetch.
// `buildGenericResourceConfig` collapses the common (data signal +
// state-key + buildSignalListConfig) call so each per-entity factory only
// declares its sortExtractors + columns + labels.

interface GenericRow {
  metadata: { name: string; namespace?: string; kubeId?: string; creationTimestamp?: string };
  kubeGuid: string;
}

function buildGenericResourceConfig<T extends GenericRow>(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
  dataSvc: KubeGenericResourceDataServiceBase<T>,
  stateKey: string,
  sortExtractors: Map<string, (row: T & { kubeGuid: string }) => unknown>,
  columns: SignalListConfig<T & { kubeGuid: string }>['columns'],
  emptyMessage: string,
  emptyFilterMessage: string,
  loadingMessage: string,
  namespaced: boolean,
): SignalListConfig<T & { kubeGuid: string }> {
  const dataSignal = computed<Array<T & { kubeGuid: string }>>(() => {
    const ns = ctx.selectedNamespace();
    const items = ns && namespaced
      ? dataSvc.itemsInNamespace(ctx.kubeGuid, ns)
      : dataSvc.itemsInCluster(ctx.kubeGuid);
    return items();
  });

  return buildSignalListConfig<T & { kubeGuid: string }>(
    injector,
    stateKey,
    dataSignal,
    sortExtractors,
    columns,
    (row) => `${row.kubeGuid}:${row.metadata?.namespace ?? ''}:${row.metadata?.name ?? ''}`,
    emptyMessage,
    emptyFilterMessage,
    loadingMessage,
    () => dataSvc.refresh({ kubeGuid: ctx.kubeGuid }),
    dataSvc.errors(),
    signal(false).asReadonly(),
  );
}

// Reusable column factories — Name / Namespace / Age cells render
// identically across all wave-3 resources. Each per-entity factory just
// concatenates these with its specific columns.
function nameColumn<T extends GenericRow>(): SignalListConfig<T>['columns'][number] {
  return {
    header: 'Name', key: 'name', kind: 'text',
    sortField: (r: T) => (r.metadata?.name ?? '').toLowerCase(),
    render: (r: T) => r.metadata?.name ?? '',
    widthHint: '24rem',
  };
}

function namespaceColumn<T extends GenericRow>(): SignalListConfig<T>['columns'][number] {
  return {
    header: 'Namespace', key: 'namespace', kind: 'link',
    sortField: (r: T) => (r.metadata?.namespace ?? '').toLowerCase(),
    link: (r: T) => r.metadata?.namespace
      ? ['/kubernetes', r.metadata?.kubeId ?? r.kubeGuid, 'namespaces', r.metadata.namespace]
      : null,
    render: (r: T) => r.metadata?.namespace ?? '',
    widthHint: '12rem',
  };
}

function ageColumn<T extends GenericRow>(): SignalListConfig<T>['columns'][number] {
  return {
    header: 'Age', key: 'age', kind: 'text',
    sortField: (r: T) => r.metadata?.creationTimestamp ?? '',
    render: (r: T) => formatAge(r.metadata?.creationTimestamp),
    widthHint: '8rem',
  };
}

const baseSortExtractors = <T extends GenericRow>(): Array<[string, (row: T) => unknown]> => [
  ['name', (r: T) => (r.metadata?.name ?? '').toLowerCase()],
  ['namespace', (r: T) => (r.metadata?.namespace ?? '').toLowerCase()],
  ['age', (r: T) => r.metadata?.creationTimestamp ?? ''],
];

// Factory: ConfigMaps. Columns: Name, Namespace, Data Keys, Age.
export function buildConfigMapsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeConfigMap> {
  const data = injector.get(KubeConfigMapDataService);
  const sortExtractors = new Map<string, (row: KubeConfigMap) => unknown>([
    ...baseSortExtractors<KubeConfigMap>(),
    ['dataKeys', (r: KubeConfigMap) => Object.keys(r.data ?? {}).length],
  ]);
  const columns: SignalListConfig<KubeConfigMap>['columns'] = [
    nameColumn<KubeConfigMap>(),
    namespaceColumn<KubeConfigMap>(),
    {
      header: 'Data Keys', key: 'dataKeys', kind: 'text',
      sortField: (r: KubeConfigMap) => Object.keys(r.data ?? {}).length,
      render: (r: KubeConfigMap) => String(Object.keys(r.data ?? {}).length),
      widthHint: '8rem',
    },
    ageColumn<KubeConfigMap>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-configmaps',
    sortExtractors, columns,
    'There are no config maps',
    'No config maps match the current filter',
    'Loading config maps…',
    true,
  );
}

// Factory: Secrets. Columns: Name, Namespace, Type, Data Keys, Age.
export function buildSecretsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeSecret> {
  const data = injector.get(KubeSecretDataService);
  const sortExtractors = new Map<string, (row: KubeSecret) => unknown>([
    ...baseSortExtractors<KubeSecret>(),
    ['type', (r: KubeSecret) => r.type ?? ''],
    ['dataKeys', (r: KubeSecret) => Object.keys(r.data ?? {}).length],
  ]);
  const columns: SignalListConfig<KubeSecret>['columns'] = [
    nameColumn<KubeSecret>(),
    namespaceColumn<KubeSecret>(),
    {
      header: 'Type', key: 'type', kind: 'text',
      sortField: (r: KubeSecret) => r.type ?? '',
      render: (r: KubeSecret) => r.type ?? '',
      widthHint: '14rem',
    },
    {
      header: 'Data Keys', key: 'dataKeys', kind: 'text',
      sortField: (r: KubeSecret) => Object.keys(r.data ?? {}).length,
      render: (r: KubeSecret) => String(Object.keys(r.data ?? {}).length),
      widthHint: '8rem',
    },
    ageColumn<KubeSecret>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-secrets',
    sortExtractors, columns,
    'There are no secrets',
    'No secrets match the current filter',
    'Loading secrets…',
    true,
  );
}

// Factory: Deployments. Columns: Name, Namespace, Replicas (ready/desired),
// Available, Age.
export function buildDeploymentsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeDeployment> {
  const data = injector.get(KubeDeploymentDataService);
  const sortExtractors = new Map<string, (row: KubeDeployment) => unknown>([
    ...baseSortExtractors<KubeDeployment>(),
    ['ready', (r: KubeDeployment) => r.status?.readyReplicas ?? 0],
    ['desired', (r: KubeDeployment) => r.spec?.replicas ?? 0],
    ['available', (r: KubeDeployment) => r.status?.availableReplicas ?? 0],
  ]);
  const columns: SignalListConfig<KubeDeployment>['columns'] = [
    nameColumn<KubeDeployment>(),
    namespaceColumn<KubeDeployment>(),
    {
      header: 'Ready', key: 'ready', kind: 'text',
      sortField: (r: KubeDeployment) => r.status?.readyReplicas ?? 0,
      render: (r: KubeDeployment) => `${r.status?.readyReplicas ?? 0}/${r.spec?.replicas ?? 0}`,
      widthHint: '6rem',
    },
    {
      header: 'Available', key: 'available', kind: 'text',
      sortField: (r: KubeDeployment) => r.status?.availableReplicas ?? 0,
      render: (r: KubeDeployment) => String(r.status?.availableReplicas ?? 0),
      widthHint: '8rem',
    },
    ageColumn<KubeDeployment>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-deployments',
    sortExtractors, columns,
    'There are no deployments',
    'No deployments match the current filter',
    'Loading deployments…',
    true,
  );
}

// Factory: ReplicaSets. Columns: Name, Namespace, Desired, Current, Ready, Age.
export function buildReplicaSetsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeReplicaSet> {
  const data = injector.get(KubeReplicaSetDataService);
  const sortExtractors = new Map<string, (row: KubeReplicaSet) => unknown>([
    ...baseSortExtractors<KubeReplicaSet>(),
    ['desired', (r: KubeReplicaSet) => r.spec?.replicas ?? 0],
    ['current', (r: KubeReplicaSet) => r.status?.replicas ?? 0],
    ['ready', (r: KubeReplicaSet) => r.status?.readyReplicas ?? 0],
  ]);
  const columns: SignalListConfig<KubeReplicaSet>['columns'] = [
    nameColumn<KubeReplicaSet>(),
    namespaceColumn<KubeReplicaSet>(),
    {
      header: 'Desired', key: 'desired', kind: 'text',
      sortField: (r: KubeReplicaSet) => r.spec?.replicas ?? 0,
      render: (r: KubeReplicaSet) => String(r.spec?.replicas ?? 0),
      widthHint: '6rem',
    },
    {
      header: 'Current', key: 'current', kind: 'text',
      sortField: (r: KubeReplicaSet) => r.status?.replicas ?? 0,
      render: (r: KubeReplicaSet) => String(r.status?.replicas ?? 0),
      widthHint: '6rem',
    },
    {
      header: 'Ready', key: 'ready', kind: 'text',
      sortField: (r: KubeReplicaSet) => r.status?.readyReplicas ?? 0,
      render: (r: KubeReplicaSet) => String(r.status?.readyReplicas ?? 0),
      widthHint: '6rem',
    },
    ageColumn<KubeReplicaSet>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-replicasets',
    sortExtractors, columns,
    'There are no replica sets',
    'No replica sets match the current filter',
    'Loading replica sets…',
    true,
  );
}

// Factory: StatefulSets. Columns: Name, Namespace, Ready, Age.
export function buildStatefulSetsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeStatefulSet> {
  const data = injector.get(KubeStatefulSetDataService);
  const sortExtractors = new Map<string, (row: KubeStatefulSet) => unknown>([
    ...baseSortExtractors<KubeStatefulSet>(),
    ['ready', (r: KubeStatefulSet) => r.status?.readyReplicas ?? 0],
  ]);
  const columns: SignalListConfig<KubeStatefulSet>['columns'] = [
    nameColumn<KubeStatefulSet>(),
    namespaceColumn<KubeStatefulSet>(),
    {
      header: 'Ready', key: 'ready', kind: 'text',
      sortField: (r: KubeStatefulSet) => r.status?.readyReplicas ?? 0,
      render: (r: KubeStatefulSet) => `${r.status?.readyReplicas ?? 0}/${r.spec?.replicas ?? 0}`,
      widthHint: '6rem',
    },
    ageColumn<KubeStatefulSet>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-statefulsets',
    sortExtractors, columns,
    'There are no stateful sets',
    'No stateful sets match the current filter',
    'Loading stateful sets…',
    true,
  );
}

// Factory: PersistentVolumes (cluster-scoped). Columns: Name, Capacity,
// Access Modes, Reclaim Policy, Status, Storage Class, Age.
export function buildPersistentVolumesSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubePersistentVolume> {
  const data = injector.get(KubePersistentVolumeDataService);
  const sortExtractors = new Map<string, (row: KubePersistentVolume) => unknown>([
    ['name', (r: KubePersistentVolume) => (r.metadata?.name ?? '').toLowerCase()],
    ['age', (r: KubePersistentVolume) => r.metadata?.creationTimestamp ?? ''],
    ['capacity', (r: KubePersistentVolume) => r.spec?.capacity?.storage ?? ''],
    ['reclaimPolicy', (r: KubePersistentVolume) => r.spec?.persistentVolumeReclaimPolicy ?? ''],
    ['status', (r: KubePersistentVolume) => r.status?.phase ?? ''],
    ['storageClass', (r: KubePersistentVolume) => r.spec?.storageClassName ?? ''],
  ]);
  const columns: SignalListConfig<KubePersistentVolume>['columns'] = [
    nameColumn<KubePersistentVolume>(),
    {
      header: 'Capacity', key: 'capacity', kind: 'text',
      sortField: (r: KubePersistentVolume) => r.spec?.capacity?.storage ?? '',
      render: (r: KubePersistentVolume) => r.spec?.capacity?.storage ?? '',
      widthHint: '8rem',
    },
    {
      header: 'Access Modes', key: 'accessModes', kind: 'text',
      render: (r: KubePersistentVolume) => (r.spec?.accessModes ?? []).join(', '),
      widthHint: '12rem',
    },
    {
      header: 'Reclaim Policy', key: 'reclaimPolicy', kind: 'text',
      sortField: (r: KubePersistentVolume) => r.spec?.persistentVolumeReclaimPolicy ?? '',
      render: (r: KubePersistentVolume) => r.spec?.persistentVolumeReclaimPolicy ?? '',
      widthHint: '10rem',
    },
    {
      header: 'Status', key: 'status', kind: 'text',
      sortField: (r: KubePersistentVolume) => r.status?.phase ?? '',
      render: (r: KubePersistentVolume) => r.status?.phase ?? '',
      widthHint: '8rem',
    },
    {
      header: 'Storage Class', key: 'storageClass', kind: 'text',
      sortField: (r: KubePersistentVolume) => r.spec?.storageClassName ?? '',
      render: (r: KubePersistentVolume) => r.spec?.storageClassName ?? '',
      widthHint: '12rem',
    },
    ageColumn<KubePersistentVolume>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-persistentvolumes',
    sortExtractors, columns,
    'There are no persistent volumes',
    'No persistent volumes match the current filter',
    'Loading persistent volumes…',
    false,
  );
}

// Factory: PersistentVolumeClaims. Columns: Name, Namespace, Storage Class,
// Phase, Capacity, Age.
export function buildPersistentVolumeClaimsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubePersistentVolumeClaim> {
  const data = injector.get(KubePersistentVolumeClaimDataService);
  const sortExtractors = new Map<string, (row: KubePersistentVolumeClaim) => unknown>([
    ...baseSortExtractors<KubePersistentVolumeClaim>(),
    ['storageClass', (r: KubePersistentVolumeClaim) => r.spec?.storageClassName ?? ''],
    ['phase', (r: KubePersistentVolumeClaim) => r.status?.phase ?? ''],
    ['capacity', (r: KubePersistentVolumeClaim) => r.status?.capacity?.storage ?? ''],
  ]);
  const columns: SignalListConfig<KubePersistentVolumeClaim>['columns'] = [
    nameColumn<KubePersistentVolumeClaim>(),
    namespaceColumn<KubePersistentVolumeClaim>(),
    {
      header: 'Storage Class', key: 'storageClass', kind: 'text',
      sortField: (r: KubePersistentVolumeClaim) => r.spec?.storageClassName ?? '',
      render: (r: KubePersistentVolumeClaim) => r.spec?.storageClassName ?? '',
      widthHint: '12rem',
    },
    {
      header: 'Phase', key: 'phase', kind: 'text',
      sortField: (r: KubePersistentVolumeClaim) => r.status?.phase ?? '',
      render: (r: KubePersistentVolumeClaim) => r.status?.phase ?? '',
      widthHint: '8rem',
    },
    {
      header: 'Capacity', key: 'capacity', kind: 'text',
      sortField: (r: KubePersistentVolumeClaim) => r.status?.capacity?.storage ?? '',
      render: (r: KubePersistentVolumeClaim) => r.status?.capacity?.storage ?? '',
      widthHint: '8rem',
    },
    ageColumn<KubePersistentVolumeClaim>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-pvcs',
    sortExtractors, columns,
    'There are no persistent volume claims',
    'No persistent volume claims match the current filter',
    'Loading persistent volume claims…',
    true,
  );
}

// Factory: StorageClasses (cluster-scoped). Columns: Name, Provisioner,
// Reclaim Policy, Binding Mode, Age.
export function buildStorageClassesSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeStorageClass> {
  const data = injector.get(KubeStorageClassDataService);
  const sortExtractors = new Map<string, (row: KubeStorageClass) => unknown>([
    ['name', (r: KubeStorageClass) => (r.metadata?.name ?? '').toLowerCase()],
    ['age', (r: KubeStorageClass) => r.metadata?.creationTimestamp ?? ''],
    ['provisioner', (r: KubeStorageClass) => r.provisioner ?? ''],
    ['reclaimPolicy', (r: KubeStorageClass) => r.reclaimPolicy ?? ''],
    ['volumeBindingMode', (r: KubeStorageClass) => r.volumeBindingMode ?? ''],
  ]);
  const columns: SignalListConfig<KubeStorageClass>['columns'] = [
    nameColumn<KubeStorageClass>(),
    {
      header: 'Provisioner', key: 'provisioner', kind: 'text',
      sortField: (r: KubeStorageClass) => r.provisioner ?? '',
      render: (r: KubeStorageClass) => r.provisioner ?? '',
      widthHint: '18rem',
    },
    {
      header: 'Reclaim Policy', key: 'reclaimPolicy', kind: 'text',
      sortField: (r: KubeStorageClass) => r.reclaimPolicy ?? '',
      render: (r: KubeStorageClass) => r.reclaimPolicy ?? '',
      widthHint: '10rem',
    },
    {
      header: 'Binding Mode', key: 'volumeBindingMode', kind: 'text',
      sortField: (r: KubeStorageClass) => r.volumeBindingMode ?? '',
      render: (r: KubeStorageClass) => r.volumeBindingMode ?? '',
      widthHint: '12rem',
    },
    ageColumn<KubeStorageClass>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-storageclasses',
    sortExtractors, columns,
    'There are no storage classes',
    'No storage classes match the current filter',
    'Loading storage classes…',
    false,
  );
}

// Factory: Jobs. Columns: Name, Namespace, Completions, Duration, Age.
export function buildJobsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeJob> {
  const data = injector.get(KubeJobDataService);
  const completions = (r: KubeJob): string => {
    const succeeded = r.status?.succeeded ?? 0;
    const desired = r.spec?.completions ?? 1;
    return `${succeeded}/${desired}`;
  };
  const duration = (r: KubeJob): string => {
    const start = r.status?.startTime ? Date.parse(r.status.startTime) : 0;
    if (!start) return '';
    const end = r.status?.completionTime ? Date.parse(r.status.completionTime) : Date.now();
    const seconds = Math.max(0, Math.floor((end - start) / 1000));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };
  const sortExtractors = new Map<string, (row: KubeJob) => unknown>([
    ...baseSortExtractors<KubeJob>(),
    ['completions', (r: KubeJob) => r.status?.succeeded ?? 0],
  ]);
  const columns: SignalListConfig<KubeJob>['columns'] = [
    nameColumn<KubeJob>(),
    namespaceColumn<KubeJob>(),
    {
      header: 'Completions', key: 'completions', kind: 'text',
      sortField: (r: KubeJob) => r.status?.succeeded ?? 0,
      render: (r: KubeJob) => completions(r),
      widthHint: '8rem',
    },
    {
      header: 'Duration', key: 'duration', kind: 'text',
      render: (r: KubeJob) => duration(r),
      widthHint: '8rem',
    },
    ageColumn<KubeJob>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-jobs',
    sortExtractors, columns,
    'There are no jobs',
    'No jobs match the current filter',
    'Loading jobs…',
    true,
  );
}

// Factory: Roles. Columns: Name, Namespace, Rules, Age.
export function buildRolesSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeRole> {
  const data = injector.get(KubeRoleDataService);
  const sortExtractors = new Map<string, (row: KubeRole) => unknown>([
    ...baseSortExtractors<KubeRole>(),
    ['rules', (r: KubeRole) => r.rules?.length ?? 0],
  ]);
  const columns: SignalListConfig<KubeRole>['columns'] = [
    nameColumn<KubeRole>(),
    namespaceColumn<KubeRole>(),
    {
      header: 'Rules', key: 'rules', kind: 'text',
      sortField: (r: KubeRole) => r.rules?.length ?? 0,
      render: (r: KubeRole) => String(r.rules?.length ?? 0),
      widthHint: '6rem',
    },
    ageColumn<KubeRole>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-roles',
    sortExtractors, columns,
    'There are no roles',
    'No roles match the current filter',
    'Loading roles…',
    true,
  );
}

// Factory: ClusterRoles (cluster-scoped). Columns: Name, Rules, Age.
export function buildClusterRolesSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeClusterRole> {
  const data = injector.get(KubeClusterRoleDataService);
  const sortExtractors = new Map<string, (row: KubeClusterRole) => unknown>([
    ['name', (r: KubeClusterRole) => (r.metadata?.name ?? '').toLowerCase()],
    ['age', (r: KubeClusterRole) => r.metadata?.creationTimestamp ?? ''],
    ['rules', (r: KubeClusterRole) => r.rules?.length ?? 0],
  ]);
  const columns: SignalListConfig<KubeClusterRole>['columns'] = [
    nameColumn<KubeClusterRole>(),
    {
      header: 'Rules', key: 'rules', kind: 'text',
      sortField: (r: KubeClusterRole) => r.rules?.length ?? 0,
      render: (r: KubeClusterRole) => String(r.rules?.length ?? 0),
      widthHint: '6rem',
    },
    ageColumn<KubeClusterRole>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-clusterroles',
    sortExtractors, columns,
    'There are no cluster roles',
    'No cluster roles match the current filter',
    'Loading cluster roles…',
    false,
  );
}

// Factory: ServiceAccounts. Columns: Name, Namespace, Secrets, Age.
export function buildServiceAccountsSignalConfig(
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
): SignalListConfig<KubeServiceAccount> {
  const data = injector.get(KubeServiceAccountDataService);
  const sortExtractors = new Map<string, (row: KubeServiceAccount) => unknown>([
    ...baseSortExtractors<KubeServiceAccount>(),
    ['secrets', (r: KubeServiceAccount) => r.secrets?.length ?? 0],
  ]);
  const columns: SignalListConfig<KubeServiceAccount>['columns'] = [
    nameColumn<KubeServiceAccount>(),
    namespaceColumn<KubeServiceAccount>(),
    {
      header: 'Secrets', key: 'secrets', kind: 'text',
      sortField: (r: KubeServiceAccount) => r.secrets?.length ?? 0,
      render: (r: KubeServiceAccount) => String(r.secrets?.length ?? 0),
      widthHint: '6rem',
    },
    ageColumn<KubeServiceAccount>(),
  ];
  return buildGenericResourceConfig(
    ctx, injector, data, 'kube-resource-serviceaccounts',
    sortExtractors, columns,
    'There are no service accounts',
    'No service accounts match the current filter',
    'Loading service accounts…',
    true,
  );
}
