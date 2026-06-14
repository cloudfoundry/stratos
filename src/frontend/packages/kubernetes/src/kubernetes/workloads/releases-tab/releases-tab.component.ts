import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { EndpointsSignalService } from '../../../../../core/src/core/signals/endpoints-signal.service';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { SignalListComponent, SignalListConfig, SignalListDropdownOption } from '../../../../../core/src/shared/components/signal-list/signal-list.component';
import { HELM_ENDPOINT_TYPE } from '../../../helm/helm-entity-factory';
import { HelmRelease } from '../../../services/endpoint-data/kube-types';
import { HelmReleasesSignalConfigService } from '../list-types/helm-releases-signal-config.service';

// Signal-native helm-releases (workloads) tab. Replaces the legacy
// ngrx-backed HelmReleasesListConfig + HelmReleasesDataSource pipeline
// with a thin column wiring over HelmReleasesSignalConfigService. The
// data path goes KubeHelmDataService → signal-config → <app-signal-list>.

@Component({
  selector: 'app-releases-tab',
  templateUrl: './releases-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SignalListComponent,
  ],
  providers: [DatePipe],
})
export class HelmReleasesTabComponent {
  public helmIds$: Observable<string[]>;
  private endpointsSignals = inject(EndpointsSignalService);
  private datePipe = inject(DatePipe);
  readonly signalConfig = inject(HelmReleasesSignalConfigService);

  // Helm endpoint guids for the page header chips. Replaces the legacy
  // `store.select(endpointOfTypeSelector(HELM_ENDPOINT_TYPE))` read.
  private readonly helmEndpointIds = computed(() =>
    Object.values(this.endpointsSignals.endpoints())
      .filter(ep => ep?.cnsi_type === HELM_ENDPOINT_TYPE)
      .map(ep => ep.guid)
      .filter((g): g is string => !!g),
  );

  readonly listConfig: WritableSignal<SignalListConfig<HelmRelease> | undefined> = signal(undefined);

  // Cluster + namespace dropdown options derived from the loaded
  // releases. Empty value = "All".
  private readonly clusterOptions = computed<SignalListDropdownOption[]>(() => {
    const seen = new Set<string>();
    this.signalConfig.releases().forEach(r => seen.add(r.endpointId));
    return [
      { label: 'All Clusters', value: null },
      ...Array.from(seen).sort().map(g => ({ label: g, value: g })),
    ];
  });

  private readonly namespaceOptions = computed<SignalListDropdownOption[]>(() => {
    const kube = this.signalConfig.kubeIdFilter();
    const seen = new Set<string>();
    this.signalConfig.releases().forEach(r => {
      if (!kube || r.endpointId === kube) seen.add(r.namespace);
    });
    return [
      { label: 'All Namespaces', value: null },
      ...Array.from(seen).sort().map(n => ({ label: n, value: n })),
    ];
  });

  constructor() {
    // Endpoint-id stream for the page header. Bridges the helmEndpointIds
    // computed signal to an Observable for PageHeaderComponent's input.
    this.helmIds$ = toObservable(this.helmEndpointIds);

    this.signalConfig.initialize();
    void this.signalConfig.loadAll();

    // Bridge dropdown WritableSignals (string | null) to the config's
    // string-only filter signals. Empty string = "All".
    const kubeSelected: WritableSignal<string | null> = signal<string | null>(null);
    const nsSelected: WritableSignal<string | null> = signal<string | null>(null);

    this.listConfig.set({
      pagedItems: this.signalConfig.view.pagedItems,
      totalFilteredResults: this.signalConfig.view.totalFilteredResults,
      totalPages: this.signalConfig.view.totalPages,
      pageIndex: this.signalConfig.pageIndex,
      pageSize: this.signalConfig.pageSize,
      isAnyLoading: this.signalConfig.isLoading(),
      errorsByCnsi: signal(new Map()),
      pageSizeOptions: { table: [10, 25, 50, 100], card: [9, 45, 90] },
      columns: [
        {
          header: 'Name', key: 'name',
          sortField: (r: HelmRelease) => (r.name ?? '').toLowerCase(),
          kind: 'link',
          link: (r: HelmRelease) => [r.guid],
          render: (r: HelmRelease) => r.name,
          widthHint: '20rem',
        },
        {
          header: 'Cluster', key: 'cluster',
          kind: 'text',
          render: (r: HelmRelease) => r.endpointId,
          widthHint: '14rem',
        },
        {
          header: 'Namespace', key: 'namespace',
          sortField: (r: HelmRelease) => (r.namespace ?? '').toLowerCase(),
          kind: 'link',
          link: (r: HelmRelease) => ['/kubernetes', r.endpointId, 'namespaces', r.namespace],
          render: (r: HelmRelease) => r.namespace,
          widthHint: '12rem',
        },
        {
          header: 'Status', key: 'status',
          sortField: (r: HelmRelease) => (r.status ?? '').toLowerCase(),
          kind: 'text',
          render: (r: HelmRelease) => titleCase(r.status),
          widthHint: '10rem',
        },
        {
          header: 'Chart Version', key: 'version',
          sortField: (r: HelmRelease) => r.chart?.metadata?.version ?? '',
          kind: 'text',
          render: (r: HelmRelease) => r.chart?.metadata?.version ?? '',
          widthHint: '10rem',
        },
        {
          header: 'Last Deployed', key: 'lastDeployed',
          sortField: (r: HelmRelease) => r.lastDeployed ?? new Date(0),
          kind: 'text',
          render: (r: HelmRelease) => r.lastDeployed ? this.datePipe.transform(r.lastDeployed, 'medium') ?? '' : '',
          widthHint: '14rem',
        },
      ],
      getRowKey: (r: HelmRelease) => r.guid,
      emptyMessage: 'There are no workloads',
      emptyFilterMessage: 'There are no workloads for the current filter',
      loadingMessage: 'Loading workloads…',
      nameFilter: this.signalConfig.nameFilter,
      filterDropdowns: [
        { label: 'Cluster', options: this.clusterOptions, selected: kubeSelected },
        { label: 'Namespace', options: this.namespaceOptions, selected: nsSelected },
      ],
      onRefresh: () => this.signalConfig.refresh(),
      onClear: () => {
        this.signalConfig.clearFilters();
        kubeSelected.set(null);
        nsSelected.set(null);
      },
      viewMode: this.signalConfig.viewMode,
      sort: this.signalConfig.sort,
    });

    // Wire dropdown writes to the config's filter signals.
    effect(() => {
      this.signalConfig.kubeIdFilter.set(kubeSelected() ?? '');
    });
    effect(() => {
      this.signalConfig.namespaceFilter.set(nsSelected() ?? '');
    });
  }
}

function titleCase(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.substring(1);
}
