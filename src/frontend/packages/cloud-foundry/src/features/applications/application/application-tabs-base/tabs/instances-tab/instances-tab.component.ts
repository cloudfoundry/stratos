import { CommonModule } from '@angular/common';
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
  SignalListRowAction,
  TailwindSnackBarService,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';

import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { CardAppStatusComponent } from '../../../../../../shared/components/cards/card-app-status/card-app-status.component';
import { CardAppUsageComponent } from '../../../../../../shared/components/cards/card-app-usage/card-app-usage.component';
import {
  CfAppInstancesSignalConfigService,
} from '../../../../../../shared/components/list/list-types/app-instance/cf-app-instances-signal-config.service';
import { AppInstanceActionsService } from '../../../../../../shared/services/app-instance-actions.service';
import type { StAppStat } from '../../../../../../services/endpoint-data/stratos-types';
import { AppDetailDataService } from '../../../../app-detail-data.service';

/**
 * InstancesTabComponent — slice-2 signal-native rewrite.
 *
 * - Tab-scoped `AppInstanceActionsService` and `CfAppInstancesSignalConfigService`
 *   so per-instance state (transitioningIndex, filter/sort/page) resets cleanly
 *   on navigation away from this app's detail page.
 * - Raises focus priority `'stats'` on init / lowers on destroy so the slice-1
 *   `AppDetailDataService` polling effect bumps stats to a 5s continuous cadence
 *   while the tab is mounted (mirrors legacy `ApplicationMonitorService`).
 * - Wraps the wave-2 config service's no-confirm Kill row action with a
 *   confirmation dialog at the component layer (matches peer convention; see
 *   cloud-foundry-routes-signal.component for the Delete pattern).
 */
@Component({
  selector: 'app-instances-tab',
  templateUrl: './instances-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    CardAppUsageComponent,
    SignalListComponent,
  ],
  providers: [
    AppInstanceActionsService,
    CfAppInstancesSignalConfigService,
  ],
})
export class InstancesTabComponent implements OnInit, OnDestroy {
  private dataService = inject(AppDetailDataService);
  private actionsService = inject(AppInstanceActionsService);
  private instancesConfig = inject(CfAppInstancesSignalConfigService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);

  /** Release callback returned by `dataService.raiseFocusPriority('stats')`. */
  private _releaseFocus?: () => void;

  /** Loading map projected for the signal-list framework. */
  private readonly _isAnyLoading: Signal<boolean> = computed(() => this.dataService.loading().stats);
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  /** SignalListConfig consumed by `<app-signal-list>`. Built once on construction. */
  readonly listConfig: SignalListConfig<StAppStat>;

  constructor() {
    // Build the columns from the config service, then replace the actions
    // column's factory with our confirm-wrapped version. Wave-2 service
    // exposes a no-confirm `buildRowActions` for tests/future surfaces;
    // the tab layer adds the legacy "Terminate Instance ${index}?"
    // confirmation dialog (matches legacy CfAppInstancesConfigService text).
    const baseColumns = this.instancesConfig.buildColumns();
    const columns: SignalListColumn<StAppStat>[] = baseColumns.map(col => {
      if (col.key === 'actions' && col.kind === 'actions') {
        return { ...col, actions: this.buildRowActions };
      }
      return col;
    });

    this.listConfig = {
      pagedItems: this.instancesConfig.view.pagedItems,
      totalFilteredResults: this.instancesConfig.view.totalFilteredResults,
      totalPages: this.instancesConfig.view.totalPages,
      pageIndex: this.instancesConfig.pageIndex,
      pageSize: this.instancesConfig.pageSize,
      isAnyLoading: this._isAnyLoading,
      errorsByCnsi: this._errorsByCnsi.asReadonly(),
      columns,
      getRowKey: (row: StAppStat) => `${row.index}`,
      emptyMessage: 'There are no instances of this application',
      emptyFilterMessage: 'No instances match the current filter',
      loadingMessage: 'Loading instances…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.instancesConfig.nameFilter,
      onRefresh: () => this.instancesConfig.refresh(),
      onClear: () => this.instancesConfig.clearFilters(),
      viewMode: this.instancesConfig.viewMode,
      sort: this.instancesConfig.sort,
    };
  }

  ngOnInit(): void {
    // Bump stats polling to the 5s continuous cadence while the Instances
    // tab is mounted. The release callback is idempotent per the wave-1
    // contract.
    this._releaseFocus = this.dataService.raiseFocusPriority('stats');
  }

  ngOnDestroy(): void {
    this._releaseFocus?.();
    this._releaseFocus = undefined;
  }

  /**
   * Per-row action factory. Terminate is always present (wrapped with a
   * confirmation dialog — legacy text/style preserved verbatim, see
   * `cf-app-instances-config.service.ts` listActionTerminate). SSH is
   * appended when both app-level (`sshEnabled`) and space-level
   * (`allowSsh`) feature flags are on; elided otherwise per signal-list
   * convention ("Prefer eliding when the action simply has no meaning").
   * When present but the row isn't RUNNING, SSH stays visible-disabled so
   * the kebab shape doesn't shift as instances cycle.
   */
  private readonly buildRowActions = (row: StAppStat): readonly SignalListRowAction<StAppStat>[] => {
    const disabled = this.actionsService.inFlight();
    const detail = this.dataService.appDetail();
    const space = this.dataService.space();
    const sshAvailable = !!detail?.sshEnabled && !!space?.allowSsh;

    const actions: SignalListRowAction<StAppStat>[] = [
      {
        label: 'Terminate', icon: 'cancel', danger: true,
        disabled,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Terminate Instance?',
            `Are you sure you want to terminate instance ${row.index}?`,
            'Terminate',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.actionsService.killInstance(row.index);
            } catch (err: any) {
              this.snackBar.error(`Terminate failed: ${err?.message ?? err}`);
            }
          });
        },
      },
    ];

    if (sshAvailable) {
      actions.push({
        // Use `keyboard` (classic Material Icons) — matches the CLI Info
        // button on the CF/Org/Space summary pages and is consistent with
        // the rest of the app for terminal-style entry points. `terminal`
        // is Material Symbols only; under classic Material Icons it
        // renders as the literal text "terminal", widening the kebab menu
        // and pushing the SSH label off alignment.
        label: 'SSH', icon: 'keyboard',
        disabled: disabled || row.state !== 'RUNNING',
        invoke: () => {
          this.router.navigate([
            '/applications',
            this.dataService.cnsiGuid,
            this.dataService.appGuid,
            'ssh',
            row.index,
          ]);
        },
      });
    }
    return actions;
  };
}
