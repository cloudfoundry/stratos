import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import type { EndpointModel } from '@stratosui/store';
import { EndpointErrorEventsService } from '@stratosui/store';
import { CnsiServiceOfferingsSource } from '../../../services/data-sources/cnsi-service-offerings-source';
import { MergeOrchestrator } from '../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import type { StServiceOffering } from '../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { ListStateStore } from '@stratosui/core';
import type { SignalListDropdownOption } from '@stratosui/core';

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

  private readonly state = inject(ListStateStore).bind('cf-service-offerings', {
    viewMode: 'card',
    pageSize: [6, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(o: StServiceOffering) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StServiceOffering>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;

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

  readonly viewMode = this.state.viewMode;

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
  private readonly errorEvents = inject(EndpointErrorEventsService);
  // Optional so unit tests don't have to provide it; the real app always
  // does (providedIn: 'root'). When present, used to short-circuit the
  // orchestrator's HTTP drain on revisit by pre-seeding each per-CNSI
  // source from the registry's pre-warmed services-details cache.
  private readonly registry = inject(EndpointDataRegistry, { optional: true });
  // Effect that publishes orchestrator errors to the page-header banner.
  // Re-bound on each initialize() to track the new orchestrator's
  // errorsByCnsi signal; previous binding is destroyed.
  private _errorEffect: EffectRef | undefined;
  // Sorted+joined cnsi-guid list of the current orchestrator's sources.
  // Idempotency guard: initialize() is a no-op when called with the
  // same set, so the auto-init constructor effect and the marketplace
  // component's explicit ngOnInit call don't fight each other.
  private _initializedFor: string | null = null;

  constructor() {
    const cfService = inject(CloudFoundryService, { optional: true });
    this.connectedEndpoints = cfService
      ? toSignal(cfService.connectedCFEndpoints$, { initialValue: [] as EndpointModel[] })
      : signal<EndpointModel[]>([]).asReadonly();

    this.cnsiOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const ep of this.connectedEndpoints() ?? []) {
        opts.push({ label: ep.name ?? ep.guid, value: ep.guid ?? null });
      }
      return opts;
    });

    this.endpointNames = computed(() => {
      const m = new Map<string, string>();
      for (const ep of this.connectedEndpoints() ?? []) {
        if (ep.guid && ep.name) m.set(ep.guid, ep.name);
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
    const key = [...cnsiGuids].sort().join(',');
    if (key === this._initializedFor) return;
    this._initializedFor = key;
    this._hasLoadedOnce.set(false);
    const sources = cnsiGuids.map(guid => {
      const source = new CnsiServiceOfferingsSource(guid, this.http);
      // Pre-seed from the registry's services-details cache when the
      // pre-warm has already populated it. Skip when a fresh load is
      // in-flight — the in-flight will write the cache itself, and the
      // orchestrator's load() will fall through to its normal HTTP drain
      // (cheap on a hot backend) rather than risk seeding mid-flight
      // stale data.
      const ds = this.registry?.acquire(guid);
      if (ds && !ds.isLoadingServicesDetails()) {
        const bundle = ds.serviceOfferingsAndPlans();
        if (bundle) source.preSeed(bundle.offerings);
      }
      return source;
    });
    this.orchestrator = new MergeOrchestrator<StServiceOffering>(sources);
    this.view = new ViewPipeline<StServiceOffering>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    this._errorEffect?.destroy();
    this._errorEffect = effect(() => {
      // Record endpoint fetch errors into the signal-native error bus, which
      // drives the page-header banner + /errors page via GlobalEventService.
      this.errorEvents.recordEndpointErrors(this.orchestrator.errorsByCnsi());
    }, { injector: this.injector });
  }

  async loadAll(): Promise<void> {
    await this.orchestrator.load();
    this._hasLoadedOnce.set(true);
    this.writeBackToRegistry();
  }

  async refresh(): Promise<void> {
    if (!this.orchestrator) return;
    await this.orchestrator.refresh();
    this._hasLoadedOnce.set(true);
    this.writeBackToRegistry();
  }

  // Push the per-CNSI offerings array back into the registry's
  // services-details cache so the next visit to Marketplace finds a hot
  // bundle. Plans are out of scope for this orchestrator (the offerings
  // handler doesn't drain plans alongside) — pass [] so the timestamp
  // still gets stamped without overwriting any plans previously seeded
  // by loadServicesDetails().
  private writeBackToRegistry(): void {
    if (!this.registry || !this.orchestrator) return;
    for (const source of this.orchestrator.sources) {
      const ds = this.registry.acquire(source.cnsiGuid);
      const existing = ds.serviceOfferingsAndPlans();
      const plans = existing?.plans ?? [];
      ds.setServiceOfferingsAndPlans(source.items() as StServiceOffering[], plans);
    }
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
