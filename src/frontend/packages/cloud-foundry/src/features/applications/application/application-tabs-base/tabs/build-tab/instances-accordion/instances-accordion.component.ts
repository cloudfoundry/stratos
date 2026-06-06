import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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
} from '@stratosui/core';

import {
  CfAppInstancesSignalConfigService,
} from '../../../../../../../shared/signal-list-configs/app-instance/cf-app-instances-signal-config.service';
import { AppInstanceActionsService } from '../../../../../../../shared/services/app-instance-actions.service';
import { InstanceUsageChartComponent } from '../../../../../../../shared/components/instance-usage-chart/instance-usage-chart.component';
import type { StAppStat } from '../../../../../../../services/endpoint-data/stratos-types';
import { AppDetailDataService } from '../../../../../app-detail-data.service';

/**
 * InstancesAccordionComponent — Summary-page disclosure section that gates
 * live instance polling behind an expand/collapse interaction.
 *
 * Collapsed by default: the header shows a proportion bar (running/desired)
 * and the last-known "updated HH:MM:SS" timestamp, so an operator sees fleet
 * health at a glance without paying the cost of a continuous poll.
 *
 * On EXPAND it raises focus priority `'stats'` on `AppDetailDataService`
 * (5s continuous poll) and renders the per-instance table plus three live
 * usage trend charts (CPU/Memory/Disk). On COLLAPSE it invokes the release
 * callback so polling drops back to the settling cadence; the last-known
 * data stays on screen and the usage ring buffer freezes (the buffer only
 * grows while stats focus is held — see AppDetailDataService.appendUsageSample).
 * On DESTROY the release fires regardless, as a safety net.
 *
 * Absorbs the slice-2 Instances-tab list logic: tab-scoped
 * `AppInstanceActionsService` + `CfAppInstancesSignalConfigService` providers
 * and the confirm-wrapped Terminate/SSH row actions. Replaces the former
 * standalone Instances tab; this accordion is the Summary-page home for
 * per-instance telemetry and actions.
 */
@Component({
  selector: 'app-instances-accordion',
  templateUrl: './instances-accordion.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
    InstanceUsageChartComponent,
  ],
  providers: [
    AppInstanceActionsService,
    CfAppInstancesSignalConfigService,
  ],
})
export class InstancesAccordionComponent implements OnDestroy {
  private dataService = inject(AppDetailDataService);
  private actionsService = inject(AppInstanceActionsService);
  private instancesConfig = inject(CfAppInstancesSignalConfigService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);

  /** Release callback returned by `dataService.raiseFocusPriority('stats')`. */
  private _releaseFocus?: () => void;

  /** Disclosure state — collapsed by default. */
  readonly open = signal(false);

  /** Currently-selected sample cadence (ms); mirrors the data service default. */
  readonly intervalMs = signal(5000);

  /** Loading map projected for the signal-list framework. */
  private readonly _isAnyLoading: Signal<boolean> = computed(() => this.dataService.loading().stats);
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  /** SignalListConfig consumed by `<app-signal-list>`. Built once on construction. */
  readonly listConfig: SignalListConfig<StAppStat>;

  // ---------------------------------------------------------------------------
  // Header / proportion-bar reads
  // ---------------------------------------------------------------------------

  /** RUNNING instance count from per-instance stats. */
  readonly running = computed(() => this.dataService.stats().filter(s => s.state === 'RUNNING').length);

  /**
   * Desired instance count off the app entity — same source the scale
   * (card-app-instances) and status cards read, so the denominator stays
   * consistent across the Summary page.
   */
  readonly desired = computed(() => this.dataService.app()?.entity?.instances ?? 0);

  /** True when fewer instances are RUNNING than desired — amber proportion bar. */
  readonly degraded = computed(() => this.running() < this.desired());

  /** Proportion-bar fill width (0–100%). Guards a 0 desired count. */
  readonly fillPercent = computed(() => {
    const d = this.desired();
    if (d <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.running() / d) * 100));
  });

  /** Timestamp of the last successful stats fetch — drives "updated …". */
  readonly fetchedAt = this.dataService.statsFetchedAt;

  /** Per-instance usage history ring buffer — feeds the live trend charts. */
  readonly usageHistory = this.dataService.usageHistory;

  constructor() {
    // Build the columns from the config service, then replace the actions
    // column's factory with our confirm-wrapped version (moved verbatim
    // from InstancesTabComponent — preserves the "Terminate Instance N?"
    // confirmation + the SSH feature-flag gating).
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

  /**
   * Toggle the disclosure. Expanding ties stats focus to the open state
   * (live 5s poll + usage-buffer growth); collapsing releases it so polling
   * settles and the buffer freezes with the last samples on screen.
   */
  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this._releaseFocus = this.dataService.raiseFocusPriority('stats');
    } else {
      this._releaseFocus?.();
      this._releaseFocus = undefined;
    }
  }

  /** Adjust the live sample cadence (5s / 10s / 30s). */
  setSampleInterval(ms: number): void {
    this.intervalMs.set(ms);
    this.dataService.setStatsPollMs(ms);
  }

  ngOnDestroy(): void {
    // Safety net: release focus even if the user navigates away while open.
    this._releaseFocus?.();
    this._releaseFocus = undefined;
  }

  // Per-row action factory. Terminate is always present (wrapped with a
  // confirmation dialog). SSH is appended only when both app-level
  // (`sshEnabled`) and space-level (`allowSsh`) feature flags are on; when
  // present but the row isn't RUNNING, SSH stays visible-disabled so the
  // kebab shape doesn't shift as instances cycle. Moved verbatim from
  // InstancesTabComponent.
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
