import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import type { EndpointModel } from '@stratosui/store';
import { CnsiServiceInstancesSource } from '../../../../../services/data-sources/cnsi-service-instances-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StServiceInstance } from '../../../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import { writeWithJob } from '../../../../../services/async-jobs/write-with-job';
import type { SignalListDropdownOption, SignalListViewMode } from '@stratosui/core';

// Services-wall list config — multi-CNSI service instances. Mirrors
// CfServiceOfferingsSignalConfigService's MergeOrchestrator + ViewPipeline
// pattern: instances from every connected CF rendered together, with a CF
// dropdown to narrow.
//
// No Org/Space dropdown at this level — single-CNSI / per-space variants
// of this page would add those filters; the wall stays foundation-wide.
// nameFilter searches across Name and ServiceOfferingName so users can
// find "the redis I named primary-cache" by typing either.
//
// Delete is the only write surface exposed; detach/edit/add stay on the
// legacy ngrx flow until a follow-up migration.
@Injectable({ providedIn: 'root' })
export class CfServiceInstancesSignalConfigService {
  orchestrator!: MergeOrchestrator<StServiceInstance>;
  view!: ViewPipeline<StServiceInstance>;

  readonly filter: WritableSignal<(si: StServiceInstance) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StServiceInstance>> = signal({ field: 'name', direction: 'asc' });
  // Default to 6 (the first card-mode option). Stays in sync with
  // viewMode='card' below — a 25 pageSize would fall outside the card
  // options [6,12,24,48,96] and the picker would render blank on first load.
  readonly pageSize: WritableSignal<number> = signal(6);
  readonly pageIndex: WritableSignal<number> = signal(0);

  // Toolbar filter inputs. `null` for the dropdown = "All" (no constraint);
  // empty string for nameFilter = no name constraint.
  readonly selectedCnsi: WritableSignal<string | null> = signal(null);
  readonly nameFilter: WritableSignal<string> = signal('');
  // Active filter column. Mirrors the marketplace pattern: when the
  // consumer registers a filter extractor for each filterable column, the
  // toolbar renders a dropdown that swaps WHICH column the text filter
  // compares against.
  readonly filterField: WritableSignal<string> = signal('name');

  // Sort extractors for columns whose sort key isn't a direct property
  // (e.g., joined Tags or the operation pill label).
  private readonly _sortExtractors: WritableSignal<Map<string, (row: StServiceInstance) => unknown>> = signal(new Map());
  private readonly _filterExtractors: WritableSignal<Map<string, (row: StServiceInstance) => string>> = signal(new Map());

  readonly viewMode: WritableSignal<SignalListViewMode> = signal('card');

  // Bridge connected-CF endpoints into a signal so computed() can read it.
  // CloudFoundryService is optional purely so unit tests don't need to
  // provide it; the real app always supplies one.
  private readonly connectedEndpoints: Signal<EndpointModel[]>;

  // CF filter dropdown options; "All" prepended as the null-value option.
  readonly cnsiOptions: Signal<SignalListDropdownOption[]>;
  // endpoint guid → endpoint name, for rendering the CF column without
  // forcing each row to look it up.
  readonly endpointNames: Signal<Map<string, string>>;

  // Flipped to true once the orchestrator's first load completes. Gates the
  // stale-selection clearer that keeps the toolbar display in sync with the
  // filter when an endpoint disconnects mid-session.
  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  private readonly injector = inject(Injector);
  private readonly http = inject(HttpClient);

  constructor() {
    const cfService = inject(CloudFoundryService, { optional: true });
    this.connectedEndpoints = cfService
      ? toSignal(cfService.connectedCFEndpoints$, { initialValue: [] as EndpointModel[] })
      : signal<EndpointModel[]>([]).asReadonly();

    this.cnsiOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const ep of this.connectedEndpoints() ?? []) {
        opts.push({ label: ep.name ?? ep.guid, value: ep.guid });
      }
      return opts;
    });

    this.endpointNames = computed(() => {
      const m = new Map<string, string>();
      for (const ep of this.connectedEndpoints() ?? []) {
        if (ep.name) m.set(ep.guid, ep.name);
      }
      return m;
    });

    // After the first load, drop any selected CF whose value no longer
    // appears in the options (e.g. user disconnected it mid-session).
    // Keeps the dropdown text consistent with what the predicate is
    // actually doing.
    effect(() => {
      if (!this._hasLoadedOnce()) return;
      const cnsiValues = new Set(this.cnsiOptions().map(o => o.value));
      const cnsi = this.selectedCnsi();
      if (cnsi != null && !cnsiValues.has(cnsi)) this.selectedCnsi.set(null);
    });

    // Re-derive the filter predicate whenever a toolbar input changes. The
    // CF filter is a direct guid match; the text filter falls back to the
    // current row's name when the registered extractor is missing.
    effect(() => {
      const cnsi = this.selectedCnsi();
      const q = this.nameFilter().trim().toLowerCase();
      const field = this.filterField();
      const extractor = this._filterExtractors().get(field);
      this.filter.set((si: StServiceInstance) => {
        if (cnsi && si.cnsiGuid !== cnsi) return false;
        if (q) {
          const hay = (extractor ? extractor(si) : (si.name ?? '')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    });
  }

  initialize(cnsiGuids: readonly string[]): void {
    this._hasLoadedOnce.set(false);
    const sources = cnsiGuids.map(guid => new CnsiServiceInstancesSource(guid, this.http));
    this.orchestrator = new MergeOrchestrator<StServiceInstance>(sources);
    this.view = new ViewPipeline<StServiceInstance>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
  }

  async loadAll(): Promise<void> {
    await this.orchestrator.load();
    this._hasLoadedOnce.set(true);
  }

  async refresh(): Promise<void> {
    if (!this.orchestrator) return;
    await this.orchestrator.refresh();
    this._hasLoadedOnce.set(true);
  }

  clearFilters(): void {
    this.selectedCnsi.set(null);
    this.nameFilter.set('');
    this.filterField.set('name');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  // Same registration pattern as the offerings/orgs services. Components
  // call this after building their column config; ViewPipeline reads sort
  // extractors via the signal passed at construction time, and the filter
  // effect reads filter extractors directly from this map.
  registerSortExtractor(fieldKey: string, extractor: (row: StServiceInstance) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  registerFilterExtractor(fieldKey: string, extractor: (row: StServiceInstance) => string): void {
    this._filterExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Use runInInjectionContext if a future caller needs to register
  // extractors from outside an injection context. Today's component
  // signatures are already inside an injection context.
  runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  // Delete a service instance via the CF V3 async-job contract. The
  // backend handler (DELETE /pp/v1/cf/service_instances/:cnsi/:siGuid)
  // mirrors the route/org delete shape: 202 + Location from CF for
  // managed instances (broker call needed); user-provided instances may
  // resolve immediately. writeWithJob handles both: 200 fast-path or job
  // polling. After resolution we re-load the instance list so the row
  // disappears.
  async deleteServiceInstance(cnsiGuid: string, siGuid: string): Promise<void> {
    const call = this.http.delete(`/pp/v1/cf/service_instances/${cnsiGuid}/${siGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
    await this.refresh();
  }
}
