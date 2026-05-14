import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubePod } from '../../../services/endpoint-data/kube-types';
import {
  KubernetesNodePodsSignalConfigService,
} from '../../list-types/kubernetes-node-pods/kubernetes-node-pods-signal-config.service';

// Signal-native node-pods page. Replaces the legacy ngrx-backed
// KubernetesNodePodsListConfigService + KubernetesNodePodsDataSource pair
// with a thin column wiring over KubernetesNodePodsSignalConfigService.
// Data path: KubePodDataService.podsOnNode(kubeGuid, nodeName) → signal-
// config view pipeline → <app-signal-list>.
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-pods',
  templateUrl: './kubernetes-node-pods.component.html',
  standalone: true,
  imports: [CommonModule, SignalListComponent],
})
export class KubernetesNodePodsComponent {
  private readonly nodeService = inject(KubernetesNodeService);
  readonly signalConfig = inject(KubernetesNodePodsSignalConfigService);

  readonly listConfig: WritableSignal<SignalListConfig<KubePod> | undefined> = signal(undefined);

  constructor() {
    const { kubeGuid, nodeName } = this.nodeService;
    this.signalConfig.initialize(kubeGuid, nodeName);

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
          sortField: (p: KubePod) => (p.metadata?.name ?? '').toLowerCase(),
          kind: 'text',
          render: (p: KubePod) => p.metadata?.name ?? '',
          widthHint: '24rem',
        },
        {
          header: 'Namespace', key: 'namespace',
          sortField: (p: KubePod) => (p.metadata?.namespace ?? '').toLowerCase(),
          kind: 'link',
          link: (p: KubePod) => ['/kubernetes', p.metadata?.kubeId ?? '', 'namespaces', p.metadata?.namespace ?? ''],
          render: (p: KubePod) => p.metadata?.namespace ?? '',
          widthHint: '12rem',
        },
        {
          header: 'Status', key: 'status',
          sortField: (p: KubePod) => p.expandedStatus?.status ?? '',
          kind: 'text',
          render: (p: KubePod) => p.expandedStatus?.status ?? '',
          widthHint: '10rem',
        },
        {
          header: 'Restarts', key: 'restarts',
          sortField: (p: KubePod) => p.expandedStatus?.restarts ?? 0,
          kind: 'text',
          render: (p: KubePod) => String(p.expandedStatus?.restarts ?? 0),
          widthHint: '6rem',
        },
        {
          header: 'Age', key: 'createdAt',
          sortField: (p: KubePod) => p.metadata?.creationTimestamp ?? '',
          kind: 'text',
          render: (p: KubePod) => formatAge(p.metadata?.creationTimestamp),
          widthHint: '8rem',
        },
      ],
      getRowKey: (p: KubePod) => `${p.kubeGuid}:${p.metadata?.namespace ?? ''}:${p.metadata?.name ?? ''}`,
      emptyMessage: 'There are no pods on this node',
      emptyFilterMessage: 'No pods match the current filter',
      loadingMessage: 'Loading pods…',
      pageSizeOptions: { table: [10, 25, 50, 100], card: [6, 12, 24, 48, 96] },
      nameFilter: this.signalConfig.nameFilter,
      onRefresh: () => this.signalConfig.refresh(),
      onClear: () => this.signalConfig.clearFilters(),
      viewMode: this.signalConfig.viewMode,
      sort: this.signalConfig.sort,
    });
  }
}

// Lightweight age formatter — same shape as the wave-1 namespaces tab.
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
