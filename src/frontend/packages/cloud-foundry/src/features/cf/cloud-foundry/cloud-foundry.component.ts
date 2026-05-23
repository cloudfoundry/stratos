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
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import {
  PageHeaderComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListSort,
  naturalCompare,
} from '@stratosui/core';
import type { EndpointModel } from '@stratosui/store';

import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
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
  ],
  providers: [CloudFoundryService],
})
export class CloudFoundryComponent {
  cloudFoundryService = inject(CloudFoundryService);
  private router = inject(Router);

  public readonly listConfig: Signal<SignalListConfig<EndpointModel>>;
  public readonly connectedCount: Signal<number>;

  constructor() {
    const connected: Signal<EndpointModel[]> = toSignal(
      this.cloudFoundryService.connectedCFEndpoints$,
      { initialValue: [] as EndpointModel[] },
    );
    this.connectedCount = computed(() => connected().length);

    // Single connected CF — skip the picker and route straight in.
    this.cloudFoundryService.connectedCFEndpoints$.pipe(take(1)).subscribe(endpoints => {
      if (endpoints.length === 1) {
        void this.router.navigate(['cloud-foundry', endpoints[0].guid]);
      }
    });

    const nameFilter: WritableSignal<string> = signal('');
    const filtered: Signal<EndpointModel[]> = computed(() => {
      const q = nameFilter().trim().toLowerCase();
      const all = connected();
      if (!q) return all;
      return all.filter(e => (e.name ?? '').toLowerCase().includes(q));
    });
    const sortState: WritableSignal<SignalListSort> = signal({ field: 'name', direction: 'asc' });
    const sortExtractors: Record<string, (e: EndpointModel) => unknown> = {
      name: e => e.name ?? '',
      address: e => e.api_endpoint?.Host ?? '',
      user: e => e.user?.name ?? '',
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
      ],
      getRowKey: (e: EndpointModel) => e.guid ?? e.name,
      emptyMessage: 'There are no Cloud Foundry endpoints connected',
      emptyFilterMessage: 'No Cloud Foundry endpoints match the current filters',
      loadingMessage: 'Loading…',
      nameFilter,
      filterColumns: ['name'],
      viewMode: signal('card'),
      sort: sortState,
    });
  }
}
