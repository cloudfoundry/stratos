import {
  Injectable,
  Injector,
  Signal,
  WritableSignal,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';

import { ListStateStore, SignalListColumn } from '@stratosui/core';

import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import { ServiceCatalogDataService } from '../../../../../services/endpoint-data/service-catalog-data.service';
import type { StServicePlan } from '../../../../../services/endpoint-data/stratos-types';
import {
  canShowServicePlanCosts,
  getServicePlanName,
} from '../../../../../features/service-catalog/services-helper';

/**
 * CfServicePlansSignalConfigService — service-offering Plans tab signal-list
 * configuration.
 *
 * Tab-scoped (provided in the ServicePlansComponent providers array, NOT
 * providedIn:'root') so its filter/sort/page state resets cleanly when
 * the user navigates between offerings. Source data comes from
 * ServiceCatalogDataService.servicePlansForOffering — a single bounded V3
 * native fetch (no auto-drain), refreshed via the toolbar's refresh button
 * or an explicit re-init.
 *
 * Public column renders the V3 visibilityType ("public", "admin",
 * "organization", "space") as plain text rather than embedding the
 * ServicePlanPublicComponent. The legacy table-cell wrapper used the
 * full visibility tristate (with broker-traversal); on the offering
 * detail page where each plan is loaded one shot, the simple text
 * column matches user expectations and avoids a per-row plan-visibility
 * fetch storm.
 */
@Injectable()
export class CfServicePlansSignalConfigService {
  private readonly catalog = inject(ServiceCatalogDataService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('cf-service-plans', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(p: StServicePlan) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StServicePlan>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Source data + load state.
  private readonly _source: WritableSignal<StServicePlan[]> = signal([]);
  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  readonly source: Signal<StServicePlan[]> = this._source.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errorsByCnsi: Signal<Map<string, unknown>> = this._errorsByCnsi.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StServicePlan) => unknown>> = signal(new Map());

  view!: ViewPipeline<StServicePlan>;

  private cfGuid = '';
  private offeringGuid = '';

  constructor() {
    this.view = new ViewPipeline<StServicePlan>(
      this.source,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((p: StServicePlan) => {
          if (!q) return true;
          const name = (getServicePlanName(p) ?? p.name ?? '').toLowerCase();
          return name.includes(q);
        });
      });
    });
  }

  initialize(cfGuid: string, offeringGuid: string): void {
    this.cfGuid = cfGuid;
    this.offeringGuid = offeringGuid;
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    if (!this.cfGuid || !this.offeringGuid) return;
    this._isLoading.set(true);
    try {
      const plans = await new Promise<StServicePlan[]>((resolve, reject) => {
        this.catalog.servicePlansForOffering(this.cfGuid, this.offeringGuid).subscribe({
          next: resolve,
          error: reject,
        });
      });
      // Tag each plan with the cnsi guid in case the API didn't (consumer
      // helpers like ServicePlanPublicComponent and the cost cell expect
      // it on the row shape for plan-visibility lookups).
      const tagged = plans.map(p => ({ ...p, cnsiGuid: p.cnsiGuid || this.cfGuid }));
      this._source.set(tagged);
      this._errorsByCnsi.update(m => {
        const next = new Map(m);
        next.delete(this.cfGuid);
        return next;
      });
    } catch (err) {
      this._errorsByCnsi.update(m => {
        const next = new Map(m);
        next.set(this.cfGuid, err);
        return next;
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  refresh(): Promise<void> {
    return this.loadAll();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StServicePlan) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  buildColumns(formatDate: (iso: string) => string): SignalListColumn<StServicePlan>[] {
    return [
      {
        header: 'Name',
        key: 'name',
        sortField: (row) => getServicePlanName(row) ?? row.name ?? '',
        render: (row) => getServicePlanName(row) ?? row.name ?? '',
        widthHint: '14rem',
      },
      {
        header: 'Description',
        key: 'description',
        sortField: 'description',
        render: (row) => row.description ?? '',
      },
      {
        header: 'Public',
        key: 'public',
        sortField: (row) => describeVisibility(row),
        render: (row) => describeVisibility(row),
        widthHint: '8rem',
      },
      {
        header: 'Cost',
        key: 'cost',
        sortField: (row) => describeCost(row),
        render: (row) => describeCost(row),
        widthHint: '10rem',
      },
      {
        header: 'Creation Date',
        key: 'creation',
        sortField: 'createdAt',
        render: (row) => formatDate(row.createdAt),
        widthHint: '12rem',
      },
    ];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeVisibility(row: StServicePlan): string {
  switch (row.visibilityType) {
    case 'public': return 'Yes';
    case 'admin':  return 'Admin only';
    case 'organization': return 'Organizations';
    case 'space': return 'Space';
    default: return '';
  }
}

function describeCost(row: StServicePlan): string {
  if (row.free) return 'Free';
  if (!canShowServicePlanCosts(row)) return '—';
  const costs = row.costs ?? [];
  return costs.map(c => {
    const amount = typeof c.amount === 'number' ? c.amount.toFixed(2) : String(c.amount);
    const unit = c.unit ? `/${c.unit}` : '';
    return `${c.currency || ''} ${amount}${unit}`.trim();
  }).join(', ');
}
