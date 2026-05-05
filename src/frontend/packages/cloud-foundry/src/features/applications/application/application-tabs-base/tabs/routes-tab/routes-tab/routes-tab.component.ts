import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListHeaderAction,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';

import {
  CfAppRoutesSignalConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-signal-config.service';
import { AppRouteActionsService } from '../../../../../../../shared/services/app-route-actions.service';
import type { StRoute } from '../../../../../../../services/endpoint-data/stratos-types';
import { AppDetailDataService } from '../../../../../app-detail-data.service';

/**
 * RoutesTabComponent — slice-3 signal-native rewrite.
 *
 * - Tab-scoped `AppRouteActionsService` and `CfAppRoutesSignalConfigService`
 *   so per-route transition state and filter/sort/page reset cleanly when
 *   the user navigates between apps.
 * - Triggers an explicit `routes` fetch on init (routes are not on the
 *   focus-poll cadence — Routes tab is read-modify, not continuous-read).
 * - Wraps the wave-2 config service's no-confirm Unmap/Delete row actions
 *   with confirmation dialogs at the component layer (mirrors the slice-2
 *   Instances-tab pattern). On verb success calls
 *   `dataService.removeRoute(guid)` so the row vanishes synchronously
 *   without re-fetch.
 */
@Component({
  selector: 'app-routes-tab',
  templateUrl: './routes-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SignalListComponent,
  ],
  providers: [
    AppRouteActionsService,
    CfAppRoutesSignalConfigService,
  ],
})
export class RoutesTabComponent implements OnInit, OnDestroy {
  private dataService = inject(AppDetailDataService);
  private actionsService = inject(AppRouteActionsService);
  private routesConfig = inject(CfAppRoutesSignalConfigService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);

  /** Loading projection for the signal-list framework. */
  private readonly _isAnyLoading: Signal<boolean> = computed(() => this.dataService.loading().routes);
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  readonly listConfig: SignalListConfig<StRoute>;

  constructor() {
    // Build columns from the wave-2 config service, then replace the
    // actions column's factory with our confirm-wrapped version. The
    // service's default factory invokes the verbs directly (used by
    // tests / future surfaces); the tab adds the legacy confirm dialogs.
    const baseColumns = this.routesConfig.buildColumns();
    const columns: SignalListColumn<StRoute>[] = baseColumns.map(col => {
      if (col.key === 'actions' && col.kind === 'actions') {
        return { ...col, actions: this.buildRowActions };
      }
      return col;
    });

    const headerActions: readonly SignalListHeaderAction[] = [
      {
        label: 'Add Route',
        icon: 'add',
        invoke: () => {
          void this.router.navigate([
            '/applications',
            this.dataService.cnsiGuid,
            this.dataService.appGuid,
            'add-route',
          ]);
        },
      },
    ];

    this.listConfig = {
      pagedItems: this.routesConfig.view.pagedItems,
      totalFilteredResults: this.routesConfig.view.totalFilteredResults,
      totalPages: this.routesConfig.view.totalPages,
      pageIndex: this.routesConfig.pageIndex,
      pageSize: this.routesConfig.pageSize,
      isAnyLoading: this._isAnyLoading,
      errorsByCnsi: this._errorsByCnsi.asReadonly(),
      columns,
      getRowKey: (row: StRoute) => row.guid,
      emptyMessage: 'This application has no routes',
      emptyFilterMessage: 'No routes match the current filter',
      loadingMessage: 'Loading routes…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.routesConfig.nameFilter,
      onRefresh: () => this.routesConfig.refresh(),
      onClear: () => this.routesConfig.clearFilters(),
      viewMode: this.routesConfig.viewMode,
      sort: this.routesConfig.sort,
      headerActions,
    };
  }

  ngOnInit(): void {
    // Routes are not auto-polled — fetch on tab mount.
    void this.dataService.refresh('routes');
  }

  ngOnDestroy(): void {
    // No focus-priority hold to release; ngOnDestroy kept for symmetry
    // with peer tabs and as the place to unwind future subscriptions.
  }

  /**
   * Per-row action factory. Wraps the wave-2 service's Unmap and Delete
   * verbs with confirmation dialogs (legacy text style). On confirm we
   * await the verb, then evict the row from the cache so the list
   * updates without a re-fetch round-trip.
   */
  private readonly buildRowActions = (row: StRoute): readonly SignalListRowAction<StRoute>[] => {
    const disabled = this.actionsService.inFlight();
    const label = row.url || row.guid;
    return [
      {
        label: 'Unmap', icon: 'block',
        disabled,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Unmap Route from Application?',
            `Are you sure you want to unmap ${label} from this application?`,
            'Unmap',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.actionsService.unmapRoute(row.guid);
              this.dataService.removeRoute(row.guid);
            } catch (err: any) {
              this.snackBar.open(`Unmap failed: ${err?.message ?? err}`, 'Dismiss');
            }
          });
        },
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        disabled,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Route?',
            `Are you sure you want to delete ${label}? This will remove the route entirely.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.actionsService.deleteRoute(row.guid);
              this.dataService.removeRoute(row.guid);
            } catch (err: any) {
              this.snackBar.open(`Delete failed: ${err?.message ?? err}`, 'Dismiss');
            }
          });
        },
      },
    ];
  };
}
