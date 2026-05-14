import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Input, OnChanges, OnInit, SimpleChanges, WritableSignal, computed, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { CfAuditEventsSignalConfigService } from '../list/list-types/cf-events/cf-audit-events-signal-config.service';
import { CloudFoundryEndpointService } from '../../../features/cf/services/cloud-foundry-endpoint.service';
import type { StAuditEvent } from '../../../services/endpoint-data/stratos-types';

// Signal-native shared events list component. Used by four page
// consumers — the foundation-wide CF Events tab plus the org / space /
// app event tabs — each setting different scoping inputs. Drives a
// SignalListComponent backed by CfAuditEventsSignalConfigService;
// scope inputs map onto the service's basePredicate.
//
// Scope inputs are mutually-cumulative (orgGuid AND spaceGuid AND
// targetGuid AND typeMustContain). The legacy server-side query-param
// scoping (organization_guids, space_guids, target_guids) is replaced
// by client-side filtering against the foundation-wide event stream.
// The handler caps at 25k events so deep historical retrieval will
// need a future detail-screen / search feature.
@Component({
  selector: 'app-cloud-foundry-events-list',
  templateUrl: './cloud-foundry-events-list.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class CloudFoundryEventsListComponent implements OnInit, OnChanges {
  @Input() orgGuid?: string;
  @Input() spaceGuid?: string;
  @Input() targetGuid?: string;
  // Restricts visible events to those whose `type` contains this
  // substring. App tabs set this to `'audit.app'` so platform-level
  // events (org/space CRUD) don't bleed into the app event log.
  @Input() typeMustContain?: string;

  cfEndpointService = inject(CloudFoundryEndpointService);
  private eventsConfig = inject(CfAuditEventsSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StAuditEvent> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.eventsConfig.initialize(cfGuid);

    this.listConfig.set({
      pagedItems: this.eventsConfig.view.pagedItems,
      totalFilteredResults: this.eventsConfig.view.totalFilteredResults,
      totalPages: this.eventsConfig.view.totalPages,
      pageIndex: this.eventsConfig.pageIndex,
      pageSize: this.eventsConfig.pageSize,
      isAnyLoading: computed(() => !this.eventsConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Time', key: 'createdAt', sortField: 'createdAt',
          render: (e: StAuditEvent) => CloudFoundryEventsListComponent.formatDate(e.createdAt),
          widthHint: '12rem',
        },
        {
          header: 'Type', key: 'type', sortField: 'type',
          kind: 'text',
          render: (e: StAuditEvent) => e.type,
          widthHint: '20rem',
        },
        {
          header: 'Actor', key: 'actorName', sortField: 'actorName',
          kind: 'text',
          render: (e: StAuditEvent) => `${e.actorName || '—'} (${e.actorType || 'unknown'})`,
          widthHint: '14rem',
        },
        {
          header: 'Target', key: 'targetName', sortField: 'targetName',
          kind: 'text',
          render: (e: StAuditEvent) => `${e.targetName || '—'} (${e.targetType || 'unknown'})`,
          widthHint: '14rem',
        },
        {
          header: 'Space', key: 'spaceName', sortField: 'spaceName',
          kind: 'text',
          render: (e: StAuditEvent) => e.spaceName || '—',
          widthHint: '10rem',
        },
        {
          header: 'Organization', key: 'organizationName', sortField: 'organizationName',
          kind: 'text',
          render: (e: StAuditEvent) => e.organizationName || '—',
          widthHint: '10rem',
        },
      ],
      getRowKey: (e: StAuditEvent) => `${e.cnsiGuid}:${e.guid}`,
      emptyMessage: 'There are no events to display',
      emptyFilterMessage: 'No events match the current filters',
      loadingMessage: 'Loading events…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.eventsConfig.nameFilter,
      onRefresh: () => this.eventsConfig.refresh(),
      onClear: () => this.eventsConfig.clearFilters(),
      viewMode: this.eventsConfig.viewMode,
      sort: this.eventsConfig.sort,
    });
  }

  // @Input() values are not bound at constructor time. Setting the
  // predicate here (with the inputs guaranteed bound) before triggering
  // the data fetch keeps cross-org/space events from rendering during
  // the initial load. Same fix shape as the per-CF tabs: scope first,
  // then load.
  ngOnInit(): void {
    this.applyBasePredicate();
    void this.eventsConfig.loadAll();
  }

  // Re-apply the base predicate when scope inputs change (Angular
  // re-binds the same component instance when navigating between
  // org/space/app pages without a full re-mount).
  ngOnChanges(_changes: SimpleChanges): void {
    this.applyBasePredicate();
  }

  private applyBasePredicate(): void {
    const orgGuid = this.orgGuid;
    const spaceGuid = this.spaceGuid;
    const targetGuid = this.targetGuid;
    const typeMustContain = this.typeMustContain;
    this.eventsConfig.basePredicate.set((e: StAuditEvent) => {
      if (orgGuid && e.organizationGuid !== orgGuid) return false;
      if (spaceGuid && e.spaceGuid !== spaceGuid) return false;
      if (targetGuid && e.targetGuid !== targetGuid) return false;
      if (typeMustContain && !(e.type ?? '').includes(typeMustContain)) return false;
      return true;
    });
  }

  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
  }
}
