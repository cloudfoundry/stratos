import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListColumn, SignalListRowAction } from '@stratosui/core';

import { AppDetailDataService } from '../../../../../features/applications/app-detail-data.service';
import { AppServiceBindingActionsService } from '../../../../services/app-service-binding-actions.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StServiceCredentialBinding } from '../../../../../services/endpoint-data/stratos-types';

// CF App Service Bindings signal-list config — single-app, per-binding rows
// of the app-detail Service Bindings tab. Replaces the legacy
// AppServiceBindingListConfigService (ngrx-coupled) with a signal-native
// configuration that drives the signal-list framework.
//
// Source signal is `AppDetailDataService.serviceBindings` — the data
// service already wires the fetch + the `removeServiceBinding(guid)`
// cache eviction hook the consumer calls on verb success. Per-row Edit
// (just navigation to the SI edit stepper) and Unbind (writeWithJob)
// invoke `AppServiceBindingActionsService` verbs; confirmation dialog
// wiring stays in the consuming component, matching the routes-tab and
// instances-tab convention.
//
// Service is tab-scoped (provided in the Services tab component
// `providers` array, NOT providedIn:'root') so its filter/sort state
// resets cleanly when the user navigates between apps. The tab also
// provides AppServiceBindingActionsService at the same scope.
@Injectable()
export class CfAppServiceBindingsSignalConfigService {
  private readonly dataService = inject(AppDetailDataService);
  private readonly actionsService = inject(AppServiceBindingActionsService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('cf-app-service-bindings', {
    viewMode: 'card',
    pageSize: [9, 25],
    pageIndex: [0, 0],
    // Default sort mirrors legacy AppServiceBindingListConfigService:
    // most recent binding first via metadata.created_at -> StServiceCredentialBinding.createdAt.
    sort: [
      { field: 'createdAt', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' },
    ],
  });

  readonly filter: WritableSignal<(b: StServiceCredentialBinding) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StServiceCredentialBinding>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  // Legacy text filter ("Filter by Name") matches against the bound
  // service instance name — that's what the legacy list rendered as the
  // primary "Name" column.
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Bridge AppDetailDataService.serviceBindings (StServiceCredentialBinding[] | null)
  // into a non-null Signal<StServiceCredentialBinding[]> for ViewPipeline.
  // Mirrors the pattern in CfAppRoutesSignalConfigService.
  readonly bindings!: Signal<StServiceCredentialBinding[]>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StServiceCredentialBinding) => unknown>> = signal(new Map());

  view!: ViewPipeline<StServiceCredentialBinding>;

  constructor() {
    const src = this.dataService.serviceBindings;
    const bridge = signal<StServiceCredentialBinding[]>([]);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const value = src();
        bridge.set(value ?? []);
      });
    });
    (this as { bindings: Signal<StServiceCredentialBinding[]> }).bindings = bridge.asReadonly();

    this.view = new ViewPipeline<StServiceCredentialBinding>(
      this.bindings,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      // Filter mirrors legacy "Filter by Name" affordance: matches against
      // the bound service instance's name (substring, case-insensitive).
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((b: StServiceCredentialBinding) => {
          if (!q) return true;
          return (b.serviceInstance?.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'createdAt', direction: 'desc' });
    this.pageIndex.set(0);
  }

  // Re-fetches bindings via the data service.
  async refresh(): Promise<void> {
    await this.dataService.refresh('serviceBindings');
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StServiceCredentialBinding) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Build the column set for the Service Bindings tab. Mirrors the legacy
  // shape (Name = service instance name, Service = offering label,
  // Plan = plan name, Tags, Binding Date) plus a kebab actions column.
  // User-provided service instances render 'User Provided' for the
  // Service column and have no plan.
  buildColumns(): SignalListColumn<StServiceCredentialBinding>[] {
    return [
      {
        header: 'Name', key: 'name',
        render: (row) => row.serviceInstance?.name ?? '',
        sortField: (row) => row.serviceInstance?.name ?? '',
      },
      {
        header: 'Service', key: 'service',
        render: (row) => this.renderService(row),
        sortField: (row) => this.renderService(row),
      },
      {
        header: 'Plan', key: 'plan',
        render: (row) => row.servicePlan?.name ?? '',
        sortField: (row) => row.servicePlan?.name ?? '',
      },
      {
        header: 'Binding Date', key: 'createdAt',
        render: (row) => this.formatDate(row.createdAt),
        sortField: 'createdAt',
      },
      {
        header: '', key: 'actions',
        kind: 'actions',
        actions: this.buildRowActions,
        render: () => '',
        widthHint: '3rem',
      },
    ];
  }

  // 'User Provided' for UPS-typed instances, otherwise the offering label
  // (preferring the inline service offering ref the bindings handler
  // surfaces under ?return=summary).
  private renderService(row: StServiceCredentialBinding): string {
    if (row.serviceInstance?.type === 'user-provided') return 'User Provided';
    return row.serviceOffering?.name ?? '';
  }

  private formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  // Per-row action factory. Returns the kebab-menu entries for a row.
  // Two entries: Edit (navigate to SI edit stepper — wired in the
  // consuming component) and Unbind (writeWithJob delete). Both disabled
  // while ANY per-binding verb is in flight — the action service rejects
  // concurrent invokes, so a UI that pretended otherwise would yield
  // "click did nothing".
  //
  // Default factory invokes Unbind directly (no confirmation); the
  // consuming component overrides this to wrap with a confirm dialog
  // and to wire the Edit nav. Mirrors CfAppRoutesSignalConfigService.
  readonly buildRowActions = (row: StServiceCredentialBinding): readonly SignalListRowAction<StServiceCredentialBinding>[] => {
    const disabled = this.actionsService.inFlight();
    return [
      {
        label: 'Unbind', icon: 'block', danger: true,
        disabled,
        invoke: () => this.actionsService.unbindService(row.guid),
      },
    ];
  };
}
