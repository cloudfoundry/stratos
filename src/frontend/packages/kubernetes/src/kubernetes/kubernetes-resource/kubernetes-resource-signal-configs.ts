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

import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../services/domain-data/kube-service-data.service';
import {
  KubeNamespace,
  KubePod,
  KubeService,
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
  refresh: () => Promise<void>,
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
    onRefresh: () => refresh(),
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

  // The data signal switches when the namespace dropdown changes.
  // computed() over selectedNamespace re-evaluates and re-binds to a
  // new podsInCluster/podsInNamespace projection.
  const dataSignal = computed<KubePod[]>(() => {
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
    () => podData.refresh({ kubeGuid: ctx.kubeGuid }),
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
    () => serviceData.refresh({ kubeGuid: ctx.kubeGuid }),
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
