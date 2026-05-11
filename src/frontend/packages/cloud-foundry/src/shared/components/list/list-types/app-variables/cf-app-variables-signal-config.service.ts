import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListColumn, SignalListRowAction } from '@stratosui/core';

import { AppDetailDataService } from '../../../../../features/applications/app-detail-data.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import { AppVariableActionsService } from '../../../../services/app-variable-actions.service';
import { ListAppEnvVar } from './cf-app-variables-data-source';

// CF App Variables signal-list config — single-app, per-variable rows of
// the app-detail Variables tab. Replaces the legacy
// CfAppVariablesListConfigService (ngrx-coupled) with a signal-native
// configuration that drives the signal-list framework.
//
// Source signal is `AppDetailDataService.envVars()` — the per-app env
// envelope already fetched as part of slice 1's app-detail composition.
// User-defined entries live under `environment`; we project that map to
// `ListAppEnvVar[]` ({name, value}) for the list rows. System / VCAP /
// running / staging sections continue to render in the "All Variables"
// code block on the consuming component (read directly from envVars()).
//
// Per-row Delete invokes AppVariableActionsService.deleteVariable;
// confirmation dialog wiring stays in the consuming component to match
// peer convention (see CfAppRoutesSignalConfigService).
//
// Service is tab-scoped (provided in the Variables tab component
// `providers` array, NOT providedIn:'root') so its filter/sort state
// resets cleanly when the user navigates between apps. The tab also
// provides AppVariableActionsService at the same scope.
@Injectable()
export class CfAppVariablesSignalConfigService {
  private readonly dataService = inject(AppDetailDataService);
  private readonly actionsService = inject(AppVariableActionsService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('cf-app-variables', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    // Default sort mirrors legacy CfAppVariablesListConfigService: sort
    // by name ascending (natural-sort in legacy; the signal-list
    // framework uses standard string compare which is close enough for
    // user-defined env var names).
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(v: ListAppEnvVar) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<ListAppEnvVar>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  // Legacy text filter ("Filter by Name") matches against name.
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Derived signal: per-variable rows projected from the env envelope.
  // dataService.envVars() is `StEnvVars | undefined` (undefined =
  // pre-first-fetch); the view pipeline wants an array, so we mirror
  // through a bridge signal with explicit fallback to []. Set in the
  // constructor where an injection context is available for the effect.
  readonly variables!: Signal<ListAppEnvVar[]>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: ListAppEnvVar) => unknown>> = signal(new Map());

  view!: ViewPipeline<ListAppEnvVar>;

  constructor() {
    const src = this.dataService.envVars;
    const bridge = signal<ListAppEnvVar[]>([]);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const env = src()?.environment;
        if (!env) {
          bridge.set([]);
          return;
        }
        bridge.set(Object.keys(env).map(name => ({ name, value: env[name] as string })));
      });
    });
    (this as { variables: Signal<ListAppEnvVar[]> }).variables = bridge.asReadonly();

    this.view = new ViewPipeline<ListAppEnvVar>(
      this.variables,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      // Filter mirrors legacy "Filter by Name" text affordance: matches
      // against the variable name (substring, case-insensitive).
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((v: ListAppEnvVar) => {
          if (!q) return true;
          return (v.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  // Re-fetches envVars via the data service. envVars are not on the
  // focus-poll cadence (Variables tab is read-modify, not continuous-read);
  // this exposes a manual refresh hook for the toolbar's refresh button
  // and for action-service success callbacks in the consuming component.
  async refresh(): Promise<void> {
    await this.dataService.refresh('envVars');
  }

  registerSortExtractor(fieldKey: string, extractor: (row: ListAppEnvVar) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Build the column set for the Variables tab. Mirrors the legacy
  // shape minimally: Name + Value + actions kebab. The legacy list also
  // had an inline "edit" affordance via TableCellEditVariableComponent;
  // we keep the door open for that as a follow-up — for now, edit is
  // exposed as an Edit row action that re-opens the inline add form
  // pre-filled with the existing name+value (handled by the consuming
  // component).
  buildColumns(): SignalListColumn<ListAppEnvVar>[] {
    const columns: SignalListColumn<ListAppEnvVar>[] = [
      {
        header: 'Name', key: 'name',
        render: (row) => row.name,
        sortField: 'name',
      },
      {
        header: 'Value', key: 'value',
        render: (row) => this.renderValue(row.value),
        sortField: 'value',
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

  // Coerce env var values (which CF v3 may surface as strings, numbers,
  // or even objects for system-provided sections) to a string for the
  // signal-list cell. User-defined env vars are always strings on the
  // wire so this is a defensive cast.
  private renderValue(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  // Per-row action factory. Returns the kebab-menu entries for a row.
  // Single entry today: Delete (remove the variable). Disabled while
  // ANY per-variable verb is in flight — the action service rejects
  // concurrent invokes, so a UI that pretended otherwise would yield
  // "click did nothing".
  //
  // The actual confirmation dialog wiring is the consuming component's
  // job (matches CfAppRoutesSignalConfigService convention). The
  // default factory here is the no-confirm path used by tests and any
  // future surface that doesn't need confirmation.
  readonly buildRowActions = (row: ListAppEnvVar): readonly SignalListRowAction<ListAppEnvVar>[] => {
    const disabled = this.actionsService.inFlight();
    return [
      {
        label: 'Delete', icon: 'delete', danger: true,
        disabled,
        invoke: () => this.actionsService.deleteVariable(row.name),
      },
    ];
  };
}
