import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListColumn, SignalListRowAction, UtilsService } from '@stratosui/core';

import { AppDetailDataService } from '../../../features/applications/app-detail-data.service';
import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';
import type { StAppStat } from '../../../services/endpoint-data/stratos-types';
import { AppInstanceActionsService } from '../../services/app-instance-actions.service';

// CF App Instances signal-list config — single-app, per-instance rows of
// the app-detail Instances tab. Tab-scoped (NOT providedIn:'root') so
// filter/sort state resets when the user navigates between apps.
@Injectable()
export class CfAppInstancesSignalConfigService {
  private readonly dataService = inject(AppDetailDataService);
  private readonly actionsService = inject(AppInstanceActionsService);
  private readonly utils = inject(UtilsService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('cf-app-instances', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'index', direction: 'asc' },
      { field: 'index', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(s: StAppStat) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StAppStat>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Source signal: per-instance rows surfaced by AppDetailDataService.
  // Re-exposed here so consumers can read the same Signal<StAppStat[]>
  // off the config service (mirrors the `routes` / `stacks` accessors
  // on peer signal-config services).
  readonly stats: Signal<StAppStat[]> = this.dataService.stats;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StAppStat) => unknown>> = signal(new Map());

  view!: ViewPipeline<StAppStat>;

  constructor() {
    this.view = new ViewPipeline<StAppStat>(
      this.stats,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      // Filter matches against instance state (e.g. "running", "crashed")
      // so the user can find a misbehaving instance by typing its state.
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: StAppStat) => {
          if (!q) return true;
          return (s.state ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'index', direction: 'asc' });
    this.pageIndex.set(0);
  }

  // Re-fetches stats via the data service. Stats poll naturally on the
  // slice-2 focus cadence; this exposes a manual refresh hook for the
  // toolbar's refresh button.
  async refresh(): Promise<void> {
    await this.dataService.refresh('stats');
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StAppStat) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Builds the column set for the Instances tab. The CF Cell column is
  // omitted here because it needs cf-cell metrics the signal-native data
  // path doesn't surface yet; the consuming component appends it when
  // metrics are available (CfCellHelper.hasCellMetrics gates).
  buildColumns(): SignalListColumn<StAppStat>[] {
    const columns: SignalListColumn<StAppStat>[] = [
      {
        header: 'Index', key: 'index',
        render: (row) => `${row.index}`,
        sortField: 'index',
      },
      {
        header: 'State', key: 'state',
        kind: 'pill',
        render: (row) => row.state ?? '',
        sortField: 'state',
      },
      {
        header: 'Memory', key: 'memory',
        kind: 'gauge',
        gauge: {
          value: (row) => this.usageFraction(row.usage?.mem, row.memQuota),
          valueText: (row) => this.utils.usageBytes([row.usage?.mem ?? 0, row.memQuota ?? 0]),
          warningAt: 0.8,
          errorAt: 0.9,
        },
        // Render-as-string still required for filter/title fallback even
        // though the cell renders the gauge component, not text.
        render: (row) => this.utils.usageBytes([row.usage?.mem ?? 0, row.memQuota ?? 0]),
        sortField: (row) => this.usageFraction(row.usage?.mem, row.memQuota),
      },
      {
        header: 'Disk', key: 'disk',
        kind: 'gauge',
        gauge: {
          value: (row) => this.usageFraction(row.usage?.disk, row.diskQuota),
          valueText: (row) => this.utils.usageBytes([row.usage?.disk ?? 0, row.diskQuota ?? 0]),
          warningAt: 0.8,
          errorAt: 0.9,
        },
        render: (row) => this.utils.usageBytes([row.usage?.disk ?? 0, row.diskQuota ?? 0]),
        sortField: (row) => this.usageFraction(row.usage?.disk, row.diskQuota),
      },
      {
        header: 'CPU', key: 'cpu',
        kind: 'gauge',
        gauge: {
          // CPU usage from CF is already a 0..1 fraction (e.g. 0.0183 for
          // 1.83%) so no quota division needed. Cap at 1 so the bar
          // doesn't overflow on noisy >100% readings.
          value: (row) => Math.min(row.usage?.cpu ?? 0, 1),
          valueText: (row) => this.utils.percent(row.usage?.cpu ?? 0),
          warningAt: 0.8,
          errorAt: 0.9,
        },
        render: (row) => this.utils.percent(row.usage?.cpu ?? 0),
        sortField: (row) => row.usage?.cpu ?? 0,
      },
      {
        header: 'Uptime', key: 'uptime',
        render: (row) => row.uptime != null ? this.utils.formatUptime(row.uptime) : '-',
        sortField: 'uptime',
      },
      {
        header: 'Host', key: 'host',
        render: (row) => row.host ?? '-',
        sortField: 'host',
      },
      {
        header: '', key: 'actions',
        kind: 'actions',
        actions: this.buildRowActions,
        render: () => '',
        widthHint: '3rem',
      },
    ];
    return columns;
  }

  // Per-row action factory. Returns the kebab-menu entries for a row.
  // Single entry today: Kill (terminate the instance; CF replaces it
  // automatically). Disabled is bound to per-row precise state when
  // possible (the same index is currently transitioning) and falls
  // back to the global `inFlight` guard otherwise — overlapping
  // per-instance verbs would scramble the action service's
  // transitioningIndex signal anyway, so the framework's reentrancy
  // guard rejects a second concurrent invoke.
  //
  // The actual confirmation dialog ("Terminate Instance ${n}?") is
  // wired by the consuming component (matches peer convention — see
  // application-wall.component's Delete row action). The component
  // injects ConfirmationDialogService and replaces this.buildRowActions
  // with its own factory if a confirm dialog is required at slice-2
  // ship; the default factory here is the no-confirm path used by
  // tests and any future surface that doesn't need confirmation.
  readonly buildRowActions = (row: StAppStat): readonly SignalListRowAction<StAppStat>[] => {
    const transitioning = this.actionsService.transitioningIndex();
    const isThisRow = transitioning === row.index;
    // Per-row precise: this row's button shows disabled while it's
    // being killed. Other rows also disabled — the action service
    // rejects concurrent invokes, so a UI that pretends otherwise
    // would lead to a confusing "click did nothing" response.
    const disabled = this.actionsService.inFlight();
    return [
      {
        label: 'Kill', icon: 'cancel', danger: true,
        disabled,
        // The current-row variant is provided in case a future
        // refinement wants distinct copy ("Killing…" vs "Kill")
        // — see slice-2 followups.
        invoke: () => this.killInstance(row.index, isThisRow),
      },
    ];
  };

  // Internal kill helper. Errors propagate as Promise rejections to the
  // signal-list framework's invokeAction wrapper, which surfaces them
  // via TailwindSnackBarService — no try/catch needed here.
  // The `_` parameter is reserved for the per-row "is this row
  // currently transitioning" hint described above; it's not used by the
  // default no-confirm path.
  private async killInstance(index: number, _isThisRow: boolean): Promise<void> {
    await this.actionsService.killInstance(index);
  }

  // Bytes-of-quota → 0..1 fraction for the Memory/Disk gauges. Returns 0
  // when the quota is unknown or zero so the bar doesn't render at NaN%
  // width. Sort uses the same value so ordering matches the visual.
  private usageFraction(used: number | undefined, quota: number | undefined): number {
    if (!quota || quota <= 0) return 0;
    return Math.min(Math.max((used ?? 0) / quota, 0), 1);
  }
}
