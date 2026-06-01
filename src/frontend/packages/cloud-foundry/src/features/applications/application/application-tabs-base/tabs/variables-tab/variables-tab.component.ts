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
import { FormsModule } from '@angular/forms';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';

import { CodeBlockComponent } from '../../../../../../../../core/src/shared/components/code-block/code-block.component';
import {
  ListAppEnvVar,
} from '../../../../../../shared/signal-list-configs/app-variables/cf-app-variables.types';
import {
  CfAppVariablesSignalConfigService,
} from '../../../../../../shared/signal-list-configs/app-variables/cf-app-variables-signal-config.service';
import { AppVariableActionsService } from '../../../../../../shared/services/app-variable-actions.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';

export interface VariableTabAllEnvVarType {
  name: string;
  value: any;
  section?: boolean;
}

/**
 * VariablesTabComponent — signal-native rewrite of the app-detail
 * Variables tab. Mirrors the slice-3 RoutesTabComponent shape:
 *
 * - Tab-scoped CfAppVariablesSignalConfigService and
 *   AppVariableActionsService so per-variable transition state and
 *   filter/sort/page reset cleanly between apps.
 * - Reads the env envelope from `AppDetailDataService.envVars()` (already
 *   prefetched as part of slice 1). Triggers a refresh on tab init in
 *   case the user navigated here without going through the app-detail
 *   shell first; subsequent action-service success callbacks also call
 *   refresh so the next read sees the canonical CF view.
 * - L5 sub-nav row above the list shows the count + an inline Add
 *   Variable form (Name/Value + ✓/✕ buttons) wired to the action
 *   service. Validation runs on submit (legacy behavior) so the row
 *   stays pixel-stable while the user types.
 * - Wraps the config service's no-confirm Delete with a confirmation
 *   dialog (legacy text style).
 * - "All Variables" code block at the bottom renders the full env
 *   envelope (system + user + app/running/staging) by walking the
 *   StEnvVars sections directly.
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
    FormsModule,
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
  private snackBar = inject(TailwindSnackBarService);

  /** Loading projection for the signal-list framework. */
  private readonly _isAnyLoading: Signal<boolean> = computed(() => this.dataService.loading().envVars);
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  readonly listConfig: SignalListConfig<ListAppEnvVar>;

  /** Reactive total surfaced to the L5 sub-nav row above the list. */
  readonly totalVariables: Signal<number>;

  // ---------------------------------------------------------------------------
  // Inline add form state
  // ---------------------------------------------------------------------------

  /** True when the inline add form is open. The L5 sub-nav swaps the
   *  +Add Variable button for the form when this is true. */
  readonly isAdding: WritableSignal<boolean> = signal(false);

  /** Bound to the Name/Value inputs in the inline add form. */
  readonly addItem: WritableSignal<{ name: string; value: string }> = signal({ name: '', value: '' });

  /**
   * Name of the variable currently being edited, or null in add mode. The
   * inline form is reused for edit: when set, the Name input is locked (the
   * key is the variable's identity — only the value changes) and a save
   * routes to updateVariable instead of addVariable. Restores the per-row
   * Edit affordance dropped in the signal-native migration.
   */
  readonly editingName: WritableSignal<string | null> = signal(null);

  /**
   * Validation error for the Name input — populated by validateAndSave()
   * when the user clicks the ✓ button with an invalid Name. Empty string
   * = no error to display. Cleared on every keystroke so the user sees
   * the error disappear as they correct the input.
   *
   * Validation runs on submit, not reactively per-keystroke, to keep the
   * L5 row pixel-stable: error sits in the row's top padding via absolute
   * positioning and only renders after the user attempts to save.
   */
  readonly nameError: WritableSignal<string> = signal('');

  /** CF env var names follow shell-variable convention: must start with a
   *  letter or underscore, and contain only letters, digits, and
   *  underscores. */
  private static readonly NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

  /** Signal: names of user-defined environment variables surfaced via the
   *  data service. Used by the duplicate-name validation in
   *  validateAndSave() — it reads from the same canonical source the
   *  list rows render from, so the check stays in sync with what the
   *  user sees. */
  readonly envVarNames: Signal<string[]> = computed(() => {
    const env = this.dataService.envVars()?.environment;
    return env ? Object.keys(env) : [];
  });

  /**
   * L5 add action — opens the inline add-row form. Resets state so the
   * user always starts with empty inputs and no leftover validation
   * error from a previous attempt.
   */
  readonly addVariableAction: ListSubNavAddAction = {
    label: 'Add Variable',
    icon: 'add',
    invoke: () => {
      this.addItem.set({ name: '', value: '' });
      this.nameError.set('');
      this.editingName.set(null);
      this.isAdding.set(true);
    },
  };

  // ---------------------------------------------------------------------------
  // "All Variables" projection (read-only code block at the bottom)
  // ---------------------------------------------------------------------------

  /**
   * Flattened sections list for the "All Variables" code block: one
   * section per env source (USER PROVIDED / SYSTEM PROVIDED / APPLICATION /
   * RUNNING / STAGING) followed by its keys. Mirrors the legacy
   * `mapEnvVars` projection so the code block reads identically to the
   * pre-migration UI; section keys read straight off the StEnvVars
   * envelope rather than the legacy `*_env_json` field names.
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
    // actions column's factory with our confirm-wrapped version. The
    // service's default factory invokes the verbs directly (used by
    // tests / future surfaces); the tab adds the legacy confirm dialogs.
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
    // envVars are typically prefetched by the app-detail shell, but
    // refresh on mount handles the case where the user navigates here
    // directly (deep link / refresh) without the prefetch chain firing.
    void this.dataService.refresh('envVars');
  }

  // ---------------------------------------------------------------------------
  // Inline add form handlers
  // ---------------------------------------------------------------------------

  /** Validate the Add Variable form and either save or surface an error
   *  in the absolute-positioned slot above the Name input. */
  validateAndSave(): void {
    const item = this.addItem();
    const editing = this.editingName();
    if (editing) {
      // Edit mode: the key is fixed (Name input is locked), only the value
      // changes, so the add-path name validation (required / pattern /
      // duplicate) does not apply. Route straight to the update verb.
      this.nameError.set('');
      void this.saveEdit(editing, item.value ?? '');
      return;
    }
    const name = (item.name ?? '').trim();
    if (!name) {
      this.nameError.set('Name is required');
      return;
    }
    if (!VariablesTabComponent.NAME_PATTERN.test(name)) {
      this.nameError.set('Use letters, digits, and underscores only; must start with a letter or underscore');
      return;
    }
    if (this.envVarNames().includes(name)) {
      this.nameError.set(`'${name}' is already in use`);
      return;
    }
    this.nameError.set('');
    void this.saveAdd(name, item.value ?? '');
  }

  /** Cancel the inline add/edit form. */
  cancelAdd(): void {
    this.nameError.set('');
    this.editingName.set(null);
    this.isAdding.set(false);
  }

  /** Clear any pending validation error so it doesn't linger as the user
   *  edits. Bound to the Name input's (input) event. */
  clearNameError(): void {
    if (this.nameError()) {
      this.nameError.set('');
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Submit the new variable to the action service; on success refresh
   *  the env envelope so the next read picks up the new key and surface
   *  any error via the snack bar (mirrors slice-3 routes pattern). */
  private async saveAdd(name: string, value: string): Promise<void> {
    try {
      await this.actionsService.addVariable(name, value);
      this.isAdding.set(false);
      this.addItem.set({ name: '', value: '' });
      await this.variablesConfig.refresh();
    } catch (err: any) {
      this.snackBar.error(`Add variable failed: ${err?.message ?? err}`);
    }
  }

  /** Submit an edited variable's value via the update verb, then close the
   *  form and refresh the env envelope so the next read reflects CF. */
  private async saveEdit(name: string, value: string): Promise<void> {
    try {
      await this.actionsService.updateVariable(name, value);
      this.isAdding.set(false);
      this.editingName.set(null);
      this.addItem.set({ name: '', value: '' });
      await this.variablesConfig.refresh();
    } catch (err: any) {
      this.snackBar.error(`Update variable failed: ${err?.message ?? err}`);
    }
  }

  /**
   * Per-row action factory. Wraps the wave-2 service's Delete verb with
   * a confirmation dialog (legacy text style). On confirm we await the
   * verb, then refresh the env envelope so the row vanishes synchronously
   * (cf. routes / service-bindings tabs which evict via dataService —
   * envVars has no eviction hook because it's a single envelope, not a
   * list, so refresh is the eviction mechanism).
   */
  private readonly buildRowActions = (row: ListAppEnvVar): readonly SignalListRowAction<ListAppEnvVar>[] => {
    const disabled = this.actionsService.inFlight();
    return [
      {
        label: 'Edit', icon: 'edit',
        disabled,
        invoke: () => {
          // Reuse the inline form in edit mode: pre-fill name+value, lock
          // the Name (the key is the variable's identity), save via update.
          this.addItem.set({ name: row.name, value: row.value == null ? '' : String(row.value) });
          this.nameError.set('');
          this.editingName.set(row.name);
          this.isAdding.set(true);
        },
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
