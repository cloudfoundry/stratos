import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubeNamespace } from '../../../services/endpoint-data/kube-types';
import {
  KubernetesNamespacesSignalConfigService,
} from '../../list-types/kubernetes-namespaces/kubernetes-namespaces-signal-config.service';

// Signal-native namespaces tab. Replaces the legacy ngrx-backed
// KubernetesNamespacesListConfigService + KubernetesNamespacesDataSource
// pipeline with a thin column wiring over
// KubernetesNamespacesSignalConfigService. The data path goes
// KubeEndpointDataService → KubeNamespaceDataService → signal-config →
// <app-signal-list>.
//
// Wave-1 scope: name + status + age columns. Pod count column is omitted
// for wave-1 — wave-2 (K-pods) reintroduces it once KubePodDataService
// lands, so this tab doesn't pull pod-fetching weight on every render.
//
// Favorites are also omitted in wave-1; the legacy page exposed a
// favorite star — wave-2 (K-shared-helpers) re-adds it through a
// signal-list favorite binding plumbed via UserFavoriteManager.
@Component({
  selector: 'app-kubernetes-namespaces-tab',
  templateUrl: './kubernetes-namespaces-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SignalListComponent],
})
export class KubernetesNamespacesTabComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly kubeEndpointService = inject(KubernetesEndpointService);
  readonly signalConfig = inject(KubernetesNamespacesSignalConfigService);

  readonly listConfig: WritableSignal<SignalListConfig<KubeNamespace> | undefined> = signal(undefined);

  constructor() {
    const kubeGuid = this.kubeEndpointService.kubeGuid;
    this.signalConfig.initialize(kubeGuid);
    void this.signalConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.signalConfig.view.pagedItems,
      totalFilteredResults: this.signalConfig.view.totalFilteredResults,
      totalPages: this.signalConfig.view.totalPages,
      pageIndex: this.signalConfig.pageIndex,
      pageSize: this.signalConfig.pageSize,
      isAnyLoading: this.signalConfig.isLoading(),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name',
          // sortField is a function so it composes against metadata.name
          // (a nested field) rather than a top-level KubeNamespace key.
          sortField: (n: KubeNamespace) => (n.metadata?.name ?? '').toLowerCase(),
          kind: 'link',
          // Relative router link — `<current>/namespaces/:name`.
          link: (n: KubeNamespace) => [n.metadata.name],
          render: (n: KubeNamespace) => n.metadata.name,
          widthHint: '24rem',
        },
        {
          header: 'Status', key: 'status',
          sortField: (n: KubeNamespace) => n.status?.phase ?? '',
          kind: 'text',
          render: (n: KubeNamespace) => n.status?.phase ?? '',
          widthHint: '8rem',
        },
        {
          header: 'Age', key: 'createdAt',
          sortField: (n: KubeNamespace) => n.metadata?.creationTimestamp ?? '',
          kind: 'text',
          render: (n: KubeNamespace) => formatAge(n.metadata?.creationTimestamp),
          widthHint: '10rem',
        },
      ],
      getRowKey: (n: KubeNamespace) => `${n.kubeGuid}:${n.metadata.name}`,
      emptyMessage: 'There are no namespaces',
      emptyFilterMessage: 'No namespaces match the current filter',
      loadingMessage: 'Loading namespaces…',
      pageSizeOptions: { table: [10, 25, 50, 100], card: [6, 12, 24, 48, 96] },
      nameFilter: this.signalConfig.nameFilter,
      onRefresh: () => this.signalConfig.refresh(),
      onClear: () => this.signalConfig.clearFilters(),
      viewMode: this.signalConfig.viewMode,
      sort: this.signalConfig.sort,
    });

    // Touch activatedRoute so the linter doesn't complain about an
    // unused field — kept for parity with the legacy component which
    // injected it (sub-routes may need it later).
    void this.activatedRoute;
  }
}

// Lightweight age formatter — same shape as the legacy createKubeAgeColumn
// helper, returning a short human-friendly span. Avoids pulling in moment
// or date-fns just for a list cell.
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
