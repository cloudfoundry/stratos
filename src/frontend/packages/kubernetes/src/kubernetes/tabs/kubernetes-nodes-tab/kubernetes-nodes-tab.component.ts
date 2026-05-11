import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { KubeNode } from '../../../services/endpoint-data/kube-types';
import {
  KubernetesNodesSignalConfigService,
} from '../../list-types/kubernetes-nodes/kubernetes-nodes-signal-config.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

// Signal-native nodes tab. Mirrors the kubernetes-namespaces-tab
// pattern: pull a kubeGuid out of the per-endpoint kubernetes service,
// initialize the signal-config, then bind a SignalListConfig over the
// view pipeline + state signals.
//
// Wave-2 column scope: name, IPs (joined string), Ready (status text),
// Age. Capacity / labels / pressure / pod-count columns from the legacy
// table use cell components tied to the ngrx TableCellCustom shape; they
// reappear in a follow-up once shared signal-list custom-cell support
// lands (tracked under K-shared-helpers).

@Component({
  selector: 'app-kubernetes-nodes-tab',
  templateUrl: './kubernetes-nodes-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SignalListComponent],
})
export class KubernetesNodesTabComponent {
  private readonly kubeEndpointService = inject(KubernetesEndpointService);
  readonly signalConfig = inject(KubernetesNodesSignalConfigService);

  readonly listConfig: WritableSignal<SignalListConfig<KubeNode> | undefined> = signal(undefined);

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
          sortField: (n: KubeNode) => (n.metadata?.name ?? '').toLowerCase(),
          kind: 'text',
          render: (n: KubeNode) => n.metadata?.name ?? '',
          widthHint: '24rem',
        },
        {
          header: 'IPs', key: 'ips',
          kind: 'text',
          render: (n: KubeNode) => formatIps(n),
          widthHint: '14rem',
        },
        {
          header: 'Ready', key: 'ready',
          sortField: (n: KubeNode) => readyStatus(n),
          kind: 'text',
          render: (n: KubeNode) => readyStatus(n) || '-',
          widthHint: '8rem',
        },
        {
          header: 'Age', key: 'createdAt',
          sortField: (n: KubeNode) => n.metadata?.creationTimestamp ?? '',
          kind: 'text',
          render: (n: KubeNode) => formatAge(n.metadata?.creationTimestamp),
          widthHint: '10rem',
        },
      ],
      getRowKey: (n: KubeNode) => `${n.kubeGuid}:${n.metadata?.name ?? ''}`,
      emptyMessage: 'There are no nodes',
      emptyFilterMessage: 'No nodes match the current filter',
      loadingMessage: 'Loading nodes…',
      pageSizeOptions: { table: [10, 25, 50, 100], card: [6, 12, 24, 48, 96] },
      nameFilter: this.signalConfig.nameFilter,
      onRefresh: () => this.signalConfig.refresh(),
      onClear: () => this.signalConfig.clearFilters(),
      viewMode: this.signalConfig.viewMode,
      sort: this.signalConfig.sort,
    });
  }
}

// Joins the InternalIP / ExternalIP entries into a short string for the
// list cell. Mirrors the legacy KubernetesNodeIpsComponent output.
function formatIps(n: KubeNode): string {
  const addrs = n.status?.addresses ?? [];
  const internal = addrs.find(a => a.type === 'InternalIP')?.address ?? '';
  const external = addrs.find(a => a.type === 'ExternalIP')?.address ?? '';
  return [internal, external].filter(Boolean).join(' / ');
}

function readyStatus(n: KubeNode): string {
  const cond = (n.status?.conditions ?? []).find(c => c.type === 'Ready');
  return cond?.status ?? '';
}

// Lightweight age formatter — same shape as the namespaces-tab helper.
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
