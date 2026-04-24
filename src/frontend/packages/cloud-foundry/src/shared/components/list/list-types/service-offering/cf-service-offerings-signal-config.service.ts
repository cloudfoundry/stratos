import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import type { EndpointModel } from '@stratosui/store';
import { CnsiServiceOfferingsSource } from '../../../../../services/data-sources/cnsi-service-offerings-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import type { SignalListDropdownOption, SignalListViewMode } from '@stratosui/core';

// Marketplace list config — multi-CNSI service offerings catalog. Mirrors
// CfAppsSignalConfigService's MergeOrchestrator + ViewPipeline pattern, but
// the surface is much smaller: there's no Org/Space dropdown (offerings
// aren't scoped that way), no kebab actions (the marketplace list is read-
// only — broker-add lives elsewhere, and create-instance is on the offering
// detail page), and no per-row stats poll.
//
// A single CF filter dropdown lets the user narrow to one connected CF when
// they have several connected with overlapping catalogs. nameFilter doubles
// as a free-text filter applied across name + description + tags + broker
// (the registered filter extractors handle the column-specific projections).
@Injectable({ providedIn: 'root' })
export class CfServiceOfferingsSignalConfigService {
  orchestrator!: MergeOrchestrator<StServiceOffering>;
  view!: ViewPipeline<StServiceOffering>;

  readonly filter: WritableSignal<(o: StServiceOffering) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StServiceOffering>> = signal({ field: 'name', direction: 'asc' });
  // Default to 6 (the first card-mode option). Stays in sync with
  // viewMode='card' below — a 25 pageSize would fall outside the card
  // options [6,12,24,48,96] and the picker would render blank on first load.
  readonly pageSize: WritableSignal<number> = signal(6);
  readonly pageIndex: WritableSignal<number> = signal(0);

  // Toolbar filter inputs. `null` for the dropdown = "All" (no constraint);
  // empty string for nameFilter = no name constraint.
  readonly selectedCnsi: WritableSignal<string | null> = signal(null);
  readonly nameFilter: WritableSignal<string> = signal('');
  // Active filter column. Mirrors the app-wall pattern: when the consumer
  // registers a filter extractor for each filterable column, the toolbar
  // renders a dropdown that swaps WHICH column the text filter compares.
  readonly filterField: WritableSignal<string> = signal('name');

  // Sort extractors for columns whose sort key isn't a direct property
  // (e.g., the joined Tags string). Mirrors CfAppsSignalConfigService.
  private readonly _sortExtractors: WritableSignal<Map<string, (row: StServiceOffering) => unknown>> = signal(new Map());
  private readonly _filterExtractors: WritableSignal<Map<string, (row: StServiceOffering) => string>> = signal(new Map());

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
    // appears in the options (e.g. user disconnected it mid-session). Same
    // safety as the app-wall: keeps the dropdown text consistent with what
    // the predicate is actually doing.
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
      this.filter.set((o: StServiceOffering) => {
        if (cnsi && o.cnsiGuid !== cnsi) return false;
        if (q) {
          const hay = (extractor ? extractor(o) : (o.name ?? '')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    });
  }

  initialize(cnsiGuids: readonly string[]): void {
    this._hasLoadedOnce.set(false);
    const sources = cnsiGuids.map(guid => new CnsiServiceOfferingsSource(guid, this.http));
    this.orchestrator = new MergeOrchestrator<StServiceOffering>(sources);
    this.view = new ViewPipeline<StServiceOffering>(
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

  // Same registration pattern as CfAppsSignalConfigService. Components call
  // this after building their column config; ViewPipeline reads sort
  // extractors via the signal passed at construction time, and the filter
  // effect reads filter extractors directly from this map.
  registerSortExtractor(fieldKey: string, extractor: (row: StServiceOffering) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  registerFilterExtractor(fieldKey: string, extractor: (row: StServiceOffering) => string): void {
    this._filterExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Use runInInjectionContext if a future caller needs to register extractors
  // from outside an injection context. Today's component signatures are
  // already inside an injection context (constructor / ngOnInit) so the
  // helper isn't required.
  runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
