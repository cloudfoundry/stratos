import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Input, OnChanges, OnInit, SimpleChanges, WritableSignal, computed, effect, inject, signal, untracked } from '@angular/core';

import { SignalListCellTemplateDirective, SignalListComponent, SignalListConfig, SignalListDropdown, TailwindDialogService } from '@stratosui/core';

import { CfAuditEventsSignalConfigService } from '../../signal-list-configs/cf-events/cf-audit-events-signal-config.service';
import { CloudFoundryEndpointService } from '../../../features/cf/services/cloud-foundry-endpoint.service';
import type { StAuditEvent } from '../../../services/endpoint-data/stratos-types';
import { EventDetailComponent, hasEventMetadata, parseEventData } from './event-detail/event-detail.component';

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
    SignalListCellTemplateDirective,
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
  private dialog = inject(TailwindDialogService);

  /** Whether the event carries metadata worth a details popup (data !== {}). */
  hasDetails(e: StAuditEvent): boolean {
    return hasEventMetadata(e.data);
  }

  /** Open the event-detail dialog, titled with the event type. */
  openEventDetails(e: StAuditEvent): void {
    this.dialog.open(EventDetailComponent, {
      data: { type: e.type, metadata: parseEventData(e.data) },
    });
  }

  /**
   * Global expand/collapse of the inline metadata shown beneath each event type
   * (the v4.9.2 key/value view) — all rows at once, never a per-row control. The
   * Type cell template reads this signal, so flipping it re-renders every cell.
   */
  readonly detailsExpanded = signal(false);

  toggleDetails(): void {
    this.detailsExpanded.update(v => !v);
    // The Type cell template lives in the signal-list's view, so flipping the
    // signal alone won't re-render its cells. Re-set the config (same columns,
    // new object) to force the list to re-render — the cell then re-reads
    // detailsExpanded() and shows/hides the inline metadata for every row.
    this.listConfig.set(this.buildListConfig());
  }

  /** Parsed metadata entries for the inline view under the event type. */
  entriesFor(e: StAuditEvent): [string, unknown][] {
    return Object.entries(parseEventData(e.data));
  }

  /** Inline value rendering — strings as-is, everything else as JSON. */
  formatValue(value: unknown): string {
    if (value == null) return '';
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  // V3 audit events carry only the org/space GUID, not the name, so the
  // backend's spaceName/organizationName come through empty. Resolve them
  // against the org/space maps the toolbar already loads (endpointData), so
  // the columns show names instead of "—". Computed → the cell re-renders
  // when the maps finish loading.
  private readonly orgNameByGuid = computed(() =>
    new Map((this.eventsConfig.endpointData?.orgs() ?? []).map(o => [o.guid, o.name] as [string, string])),
  );
  private readonly spaceNameByGuid = computed(() =>
    new Map((this.eventsConfig.endpointData?.spaces() ?? []).map(s => [s.guid, s.name] as [string, string])),
  );

  spaceName(e: StAuditEvent): string {
    return e.spaceName || this.spaceNameByGuid().get(e.spaceGuid) || '—';
  }

  orgName(e: StAuditEvent): string {
    return e.organizationName || this.orgNameByGuid().get(e.organizationGuid) || '—';
  }

  public listConfig: WritableSignal<SignalListConfig<StAuditEvent> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.eventsConfig.initialize(cfGuid);

    // Org/space names load asynchronously (and the orgs map lands after the
    // first render). The Space/Org cell renders read those maps, but the
    // signal-list doesn't re-render on external signals — so re-publish the
    // config when the maps change to refresh the resolved names.
    effect(() => {
      this.orgNameByGuid();
      this.spaceNameByGuid();
      untracked(() => {
        if (this.listConfig()) {
          this.listConfig.set(this.buildListConfig());
        }
      });
    });
  }

  // @Input() values are not bound at constructor time. Building the
  // listConfig here (with inputs guaranteed bound) lets us conditionally
  // include the Org / Space dropdowns only on the foundation-wide page
  // (no scope inputs). The sub-pages pin scope via basePredicate; adding
  // dropdowns there would let users pick mismatched org/space values
  // that the predicate then clamps — confusing UX.
  ngOnInit(): void {
    this.applyBasePredicate();
    this.listConfig.set(this.buildListConfig());
    void this.eventsConfig.loadAll();
  }

  private buildListConfig(): SignalListConfig<StAuditEvent> {
    const isFoundationWide = !this.orgGuid && !this.spaceGuid && !this.targetGuid;
    const filterDropdowns: SignalListDropdown[] = isFoundationWide
      ? [
        {
          label: 'Organization',
          options: this.eventsConfig.orgOptions,
          selected: this.eventsConfig.selectedOrg,
          loading: this.eventsConfig.isLoadingOrgs,
        },
        {
          label: 'Space',
          options: this.eventsConfig.spaceOptions,
          selected: this.eventsConfig.selectedSpace,
          loading: this.eventsConfig.isLoadingSpaces,
        },
      ]
      : [];

    return {
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
          // The type is the event's identity and the drill-in: rendered as a
          // link (when the event carries metadata) that opens the details
          // dialog, titled with the type. See the `type` cell template.
          header: 'Type', key: 'type', sortField: 'type',
          kind: 'template', templateName: 'type',
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
          render: (e: StAuditEvent) => this.spaceName(e),
          widthHint: '10rem',
        },
        {
          header: 'Organization', key: 'organizationName', sortField: 'organizationName',
          kind: 'text',
          render: (e: StAuditEvent) => this.orgName(e),
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
      filterDropdowns,
      onRefresh: () => this.eventsConfig.refresh(),
      onClear: () => this.eventsConfig.clearFilters(),
      viewMode: this.eventsConfig.viewMode,
      sort: this.eventsConfig.sort,
    };
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
