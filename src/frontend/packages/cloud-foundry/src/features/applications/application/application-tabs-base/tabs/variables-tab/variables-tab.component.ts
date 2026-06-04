import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { take } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
  TailwindDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { CodeBlockComponent } from '../../../../../../../../core/src/shared/components/code-block/code-block.component';
import {
  ListAppEnvVar,
} from '../../../../../../shared/signal-list-configs/app-variables/cf-app-variables.types';
import {
  CfAppVariablesSignalConfigService,
} from '../../../../../../shared/signal-list-configs/app-variables/cf-app-variables-signal-config.service';
import {
  VariableEditDialogComponent,
  VariableEditDialogResult,
} from '../../../../../../shared/components/variable-edit-dialog/variable-edit-dialog.component';
import { AppVariableActionsService } from '../../../../../../shared/services/app-variable-actions.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';

export interface VariableTabAllEnvVarType {
  name: string;
  value: any;
  section?: boolean;
}

/**
 * VariablesTabComponent — signal-native app-detail Variables tab.
 *
 * - Tab-scoped CfAppVariablesSignalConfigService and
 *   AppVariableActionsService so per-variable transition state and
 *   filter/sort/page reset cleanly between apps.
 * - Reads the env envelope from `AppDetailDataService.envVars()`; refreshes
 *   on tab init and after each successful mutation so the next read reflects
 *   the canonical CF view.
 * - Add / Edit / Rename all go through a single popup `VariableEditDialogComponent`
 *   (stacked editable Name + multiline Monaco value editor). The L5 sub-nav's
 *   Add button and the per-row Edit action both open it; the dialog returns
 *   `{name, value}` and this component routes to add / update / rename.
 * - Delete is wrapped in a confirmation dialog and uses the action service's
 *   explicit-`null` merge-patch delete.
 * - "All Variables" code block at the bottom renders the full env envelope.
 */
@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AppVariableActionsService,
    CfAppVariablesSignalConfigService,
  ],
  imports: [
    CommonModule,
    SignalListComponent,
    ListSubNavComponent,
    CodeBlockComponent,
  ]
})
export class VariablesTabComponent implements OnInit {
  private dataService = inject(AppDetailDataService);
  private variablesConfig = inject(CfAppVariablesSignalConfigService);
  private actionsService = inject(AppVariableActionsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private dialog = inject(TailwindDialogService);
  private snackBar = inject(TailwindSnackBarService);

  /** Loading projection for the signal-list framework. */
  private readonly _isAnyLoading: Signal<boolean> = computed(() => this.dataService.loading().envVars);
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  readonly listConfig: SignalListConfig<ListAppEnvVar>;

  /** Reactive total surfaced to the L5 sub-nav row above the list. */
  readonly totalVariables: Signal<number>;

  /** Signal: names of user-defined environment variables. Used to seed the
   *  editor dialog's duplicate-name check from the same canonical source the
   *  list rows render from. */
  readonly envVarNames: Signal<string[]> = computed(() => {
    const env = this.dataService.envVars()?.environment;
    return env ? Object.keys(env) : [];
  });

  /** L5 add action — opens the editor dialog in add mode. */
  readonly addVariableAction: ListSubNavAddAction = {
    label: 'Add Variable',
    icon: 'add',
    invoke: () => this.openEditor('add'),
  };

  // ---------------------------------------------------------------------------
  // "All Variables" projection (read-only code block at the bottom)
  // ---------------------------------------------------------------------------

  /**
   * Flattened sections list for the "All Variables" code block: one
   * section per env source (USER PROVIDED / SYSTEM PROVIDED / APPLICATION /
   * RUNNING / STAGING) followed by its keys.
   */
  readonly allEnvVars: Signal<VariableTabAllEnvVarType[]> = computed(() => {
    const env = this.dataService.envVars();
    if (!env) {
      return [];
    }
    const out: VariableTabAllEnvVarType[] = [];
    const sections: Array<[string, Record<string, any> | undefined]> = [
      ['environment', env.environment],
      ['systemProvided', env.systemProvided as any],
      ['applicationProvided', env.applicationProvided],
      ['runningProvided', env.runningProvided],
      ['stagingProvided', env.stagingProvided],
    ];
    for (const [name, body] of sections) {
      if (!body || Object.keys(body).length === 0) {
        continue;
      }
      out.push({ section: true, name, value: '' });
      for (const key of Object.keys(body)) {
        const raw = (body as Record<string, any>)[key];
        out.push({
          name: key,
          value: key === 'STRATOS_PROJECT' ? this.parseStratosProject(raw) : raw,
        });
      }
    }
    return out;
  });

  constructor() {
    // Build columns from the wave-2 config service, then replace the
    // actions column's factory with our Edit-opens-dialog / confirm-delete
    // version.
    const baseColumns = this.variablesConfig.buildColumns();
    const columns: SignalListColumn<ListAppEnvVar>[] = baseColumns.map(col => {
      if (col.key === 'actions' && col.kind === 'actions') {
        return { ...col, actions: this.buildRowActions };
      }
      return col;
    });

    this.listConfig = {
      pagedItems: this.variablesConfig.view.pagedItems,
      totalFilteredResults: this.variablesConfig.view.totalFilteredResults,
      totalPages: this.variablesConfig.view.totalPages,
      pageIndex: this.variablesConfig.pageIndex,
      pageSize: this.variablesConfig.pageSize,
      isAnyLoading: this._isAnyLoading,
      errorsByCnsi: this._errorsByCnsi.asReadonly(),
      columns,
      getRowKey: (row: ListAppEnvVar) => row.name,
      emptyMessage: 'There are no variables',
      emptyFilterMessage: 'No variables match the current filter',
      loadingMessage: 'Loading variables…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.variablesConfig.nameFilter,
      onRefresh: () => this.variablesConfig.refresh(),
      onClear: () => this.variablesConfig.clearFilters(),
      viewMode: this.variablesConfig.viewMode,
      sort: this.variablesConfig.sort,
    };

    this.totalVariables = this.variablesConfig.view.totalItems;
  }

  ngOnInit(): void {
    // envVars are typically prefetched by the app-detail shell; refresh on
    // mount handles a direct deep link / refresh without the prefetch chain.
    void this.dataService.refresh('envVars');
  }

  // ---------------------------------------------------------------------------
  // Editor dialog (Add / Edit / Rename)
  // ---------------------------------------------------------------------------

  /**
   * Open the popup editor. Add mode forbids every existing name; edit mode
   * forbids every name except the row's own (so an unchanged name passes,
   * and a change to another existing key is blocked). On close the result
   * `{name, value}` is routed to the matching verb.
   */
  private openEditor(mode: 'add' | 'edit', row?: ListAppEnvVar): void {
    const existingNames = mode === 'edit'
      ? this.envVarNames().filter(n => n !== row!.name)
      : this.envVarNames();

    const ref = this.dialog.open(VariableEditDialogComponent, {
      // No fixed width: the dialog sizes to its (resizable) content so the
      // user can drag the editor wider/taller, capped at the viewport.
      maxWidth: '92vw',
      data: { mode, name: row?.name, value: row?.value, existingNames },
    });

    ref.afterClosed().pipe(take(1)).subscribe((result?: VariableEditDialogResult) => {
      if (!result) {
        return; // cancelled
      }
      void this.applyEditorResult(mode, row, result);
    });
  }

  /** Route a dialog result to add / update / rename, then refresh. */
  private async applyEditorResult(
    mode: 'add' | 'edit',
    row: ListAppEnvVar | undefined,
    result: VariableEditDialogResult,
  ): Promise<void> {
    try {
      if (mode === 'add') {
        await this.actionsService.addVariable(result.name, result.value);
      } else if (row && result.name !== row.name) {
        await this.actionsService.renameVariable(row.name, result.name, result.value);
      } else {
        await this.actionsService.updateVariable(result.name, result.value);
      }
      await this.variablesConfig.refresh();
    } catch (err: any) {
      this.snackBar.error(`Save variable failed: ${err?.message ?? err}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Per-row actions (Edit opens the dialog; Delete confirms + null-deletes)
  // ---------------------------------------------------------------------------

  private readonly buildRowActions = (row: ListAppEnvVar): readonly SignalListRowAction<ListAppEnvVar>[] => {
    const disabled = this.actionsService.inFlight();
    return [
      {
        label: 'Edit', icon: 'edit',
        disabled,
        invoke: () => this.openEditor('edit', row),
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        disabled,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Environment Variable?',
            `Are you sure you want to delete '${row.name}'?`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.actionsService.deleteVariable(row.name);
              await this.variablesConfig.refresh();
            } catch (err: any) {
              this.snackBar.error(`Delete failed: ${err?.message ?? err}`);
            }
          });
        },
      },
    ];
  };

  isObject(test: any): boolean {
    return typeof test === 'object';
  }

  private parseStratosProject(value: unknown): object | string {
    if (typeof value === 'object' && value !== null) {
      return value as object;
    }
    try {
      return JSON.parse(String(value));
    } catch (err) {
      console.warn('Failed to parse STRATOS_PROJECT env var', err);
    }
    return '';
  }
}
