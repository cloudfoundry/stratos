import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  EndpointRowActionsService,
  PageHeaderComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListPillColor,
  SignalListSort,
  naturalCompare,
} from '@stratosui/core';
import { EndpointsDataService } from '../../../../../store/src/services/endpoints-data.service';
import { withConnectingOverlay } from '@stratosui/store';
import type { EndpointModel } from '@stratosui/store';

import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { DuplicateUrlBannerComponent } from '../../../shared/components/duplicate-url-banner/duplicate-url-banner.component';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SignalListComponent,
    CfEndpointsMissingComponent,
    DuplicateUrlBannerComponent,
  ],
  providers: [CloudFoundryService],
})
export class CloudFoundryComponent {
  cloudFoundryService = inject(CloudFoundryService);
  private endpointsData = inject(EndpointsDataService);
  private router = inject(Router);
  // The CF picker is a projection of the Endpoints page onto its CF subset -
  // rows carry the same management kebab (Connect / Disconnect / Edit /
  // Unregister) via the shared builder.
  private endpointRowActions = inject(EndpointRowActionsService);

  public readonly listConfig: Signal<SignalListConfig<EndpointModel>>;
  public readonly connectedCount: Signal<number>;

  constructor() {
    // The picker lists every CF that belongs to the user — connected, expired
    // (theirs, needs reconnect), or mid-connect — not just the ones with a live
    // token. A disconnected CF the user dropped is reconnected from the
    // Endpoints page, not here.
    const available: Signal<EndpointModel[]> = this.cloudFoundryService.availableCFEndpoints;
    this.connectedCount = computed(() => available().length);

    // Single CF — skip the picker and route straight in. The decision waits on
    // whenReady() because the endpoint list is empty while the first
    // /pp/v1/info call is in flight: on a cold load (reload, bookmark, first
    // navigation after login) reading it at construction always sees zero and
    // the shortcut never fires. whenReady() also triggers that fetch if nothing
    // else has yet, and resolves on failure too — a list that never arrives
    // leaves the picker up, which is the right fallback. At this hydration point
    // no user connect is in flight, so the set holds only settled connected/
    // expired CFs; routing into a lone expired one lands on its reconnect prompt.
    void this.endpointsData.whenReady().then(() => {
      const endpoints = available();
      if (endpoints.length === 1) {
        void this.router.navigate(['cloud-foundry', endpoints[0].guid]);
      }
    });

    const nameFilter: WritableSignal<string> = signal('');
    const filtered: Signal<EndpointModel[]> = computed(() => {
      const q = nameFilter().trim().toLowerCase();
      const all = available();
      if (!q) return all;
      return all.filter(e => (e.name ?? '').toLowerCase().includes(q));
    });
    // Status the picker renders per row. The set now holds mixed states —
    // connected, expired (needs reconnect), mid-connect — so the row must say
    // which, else an expired CF looks identical to a live one. 'connecting'
    // overlays the wire status while a connect/reconnect is in flight, tracking
    // the isConnecting signal so the row updates when the operation resolves.
    const rowStatus = (e: EndpointModel): string =>
      withConnectingOverlay(e.connectionStatus, this.endpointsData.isConnecting(e.guid ?? ''));

    const sortState: WritableSignal<SignalListSort> = signal({ field: 'name', direction: 'asc' });
    const sortExtractors: Record<string, (e: EndpointModel) => unknown> = {
      name: e => e.name ?? '',
      address: e => e.api_endpoint?.Host ?? '',
      user: e => e.user?.name ?? '',
      status: e => rowStatus(e),
    };
    const sorted: Signal<EndpointModel[]> = computed(() => {
      const items = filtered();
      const { field, direction } = sortState();
      const extract = sortExtractors[field] ?? sortExtractors.name;
      const dir = direction === 'desc' ? -1 : 1;
      return [...items].sort((a, b) => {
        const av = extract(a), bv = extract(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return naturalCompare(String(av), String(bv)) * dir;
      });
    });
    const pageSize: WritableSignal<number> = signal(24);
    const pageIndex: WritableSignal<number> = signal(0);
    const paged: Signal<EndpointModel[]> = computed(() => {
      const items = sorted();
      const sz = pageSize();
      const i = pageIndex();
      return items.slice(i * sz, (i + 1) * sz);
    });

    const statusLabel = (e: EndpointModel): string => {
      const s = rowStatus(e);
      return s.charAt(0).toUpperCase() + s.slice(1);
    };
    const statusColor = (e: EndpointModel): SignalListPillColor => {
      const s = rowStatus(e);
      if (s === 'connected') return 'success';
      if (s === 'expired' || s === 'connecting') return 'warning';
      return 'neutral';
    };

    this.listConfig = signal<SignalListConfig<EndpointModel>>({
      pagedItems: paged,
      totalFilteredResults: computed(() => filtered().length),
      totalPages: computed(() => Math.max(1, Math.ceil(filtered().length / pageSize()))),
      pageIndex,
      pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (e: EndpointModel) => ['/cloud-foundry', e.guid ?? ''],
          render: (e: EndpointModel) => e.name,
          widthHint: '20rem',
        },
        {
          header: 'Address', key: 'address',
          sortField: (e: EndpointModel) => e.api_endpoint?.Host ?? '',
          render: (e: EndpointModel) => e.api_endpoint?.Host ?? '—',
          widthHint: '24rem',
        },
        {
          header: 'User', key: 'user',
          sortField: (e: EndpointModel) => e.user?.name ?? '',
          render: (e: EndpointModel) => e.user?.name ?? '—',
          widthHint: '12rem',
        },
        {
          header: 'Status', key: 'status',
          kind: 'dot',
          pillColor: statusColor,
          sortField: (e: EndpointModel) => rowStatus(e),
          render: statusLabel,
          widthHint: '10rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: (e: EndpointModel) => this.endpointRowActions.buildEndpointActions(e, { unregister: false }),
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (e: EndpointModel) => e.guid ?? e.name,
      emptyMessage: 'There are no connected or expired Cloud Foundry endpoints',
      emptyFilterMessage: 'No Cloud Foundry endpoints match the current filters',
      loadingMessage: 'Loading…',
      nameFilter,
      filterColumns: ['name'],
      viewMode: signal('card'),
      sort: sortState,
    });
  }
}
