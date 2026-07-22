import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore } from '@stratosui/core';

import { AutoscalerScalingHistoryDataService } from '../../../services/domain-data/autoscaler-scaling-history-data.service';
import { AppAutoscalerEvent } from '../../../store/app-autoscaler.types';
import { ViewPipeline, SortSpec } from '../../../../../cloud-foundry/src/services/data-sources/view-pipeline';

// CF Autoscaler scaling-history events list config — single (cnsi, app),
// read-only. Drives the Autoscaler "Scaling Events" sub-page. Replaces
// CfAppAutoscalerEventsConfigService + CfAppAutoscalerEventsDataSource;
// pulls events from AutoscalerScalingHistoryDataService (signal-native)
// instead of dispatching GetAppAutoscalerScalingHistoryAction through
// @ngrx Store. Last @ngrx survivor for cf-autoscaler events.
//
// Default sort = newest-first (timestamp desc) to match the legacy list,
// where the data source pre-sorted by descending timestamp via the
// pagination action's order-direction param.
@Injectable({ providedIn: 'root' })
export class CfAppAutoscalerEventsSignalConfigService {
  private readonly historyData = inject(AutoscalerScalingHistoryDataService);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private appGuid = '';

  // Per-mode UI state. Persisted under `cf-app-autoscaler-events`.
  private readonly state = inject(ListStateStore).bind('cf-app-autoscaler-events', {
    viewMode: 'table',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'timestamp', direction: 'desc' },
      { field: 'timestamp', direction: 'desc' },
    ],
  });

  readonly filter: WritableSignal<(e: AppAutoscalerEvent) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<AppAutoscalerEvent>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Mirror the data service's events signal so the table re-renders
  // immediately as load() resolves.
  readonly events: Signal<AppAutoscalerEvent[]> = computed(() =>
    this.cnsiGuid && this.appGuid ? this.historyData.events(this.cnsiGuid, this.appGuid)() : [],
  );

  // Page is "loaded" once at least one fetch has resolved (loading flips
  // false). The legacy list showed an empty body until the first page
  // landed; this preserves that behavior with the spinner gating on the
  // initial fetch instead of subsequent refreshes.
  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: AppAutoscalerEvent) => unknown>> = signal(new Map());

  view!: ViewPipeline<AppAutoscalerEvent>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  initialize(cnsiGuid: string, appGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.appGuid = appGuid;

    this.view = new ViewPipeline<AppAutoscalerEvent>(
      this.events,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((ev: AppAutoscalerEvent) => {
          if (!q) return true;
          // Free-text filter scans the message + reason + error so the
          // user can type a fragment of any human-readable explanation
          // and find it without picking a column.
          return (
            (ev.message ?? '').toLowerCase().includes(q) ||
            (ev.reason ?? '').toLowerCase().includes(q) ||
            (ev.error ?? '').toLowerCase().includes(q)
          );
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.cnsiGuid || !this.appGuid) return;
    try {
      await this.historyData.load(this.cnsiGuid, this.appGuid);
    } catch {
      // load() rethrows after recording the failure in its own error()
      // signal (which the page renders). Swallow here so the fire-and-
      // forget `void loadAll()` call site doesn't raise an unhandled
      // promise rejection.
    } finally {
      this._hasLoadedOnce.set(true);
    }
  }

  refresh(): Promise<void> {
    return this.loadAll();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'timestamp', direction: 'desc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: AppAutoscalerEvent) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
