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
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';

import { ApplicationService } from '../../../../application.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import {
  CfAppServiceBindingsSignalConfigService,
} from '../../../../../../shared/signal-list-configs/app-sevice-bindings/cf-app-service-bindings-signal-config.service';
import { AppServiceBindingActionsService } from '../../../../../../shared/services/app-service-binding-actions.service';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions.types';
import { CSI_CANCEL_URL } from '../../../../../../shared/components/add-service-instance/csi-mode.service';
import { SERVICE_INSTANCE_TYPES } from '../../../../../../shared/components/add-service-instance/add-service-instance-base-step/add-service-instance.types';
import type { StServiceCredentialBinding } from '../../../../../../services/endpoint-data/stratos-types';

/**
 * ServicesTabComponent — signal-native rewrite of the app-detail Service
 * Bindings tab. Mirrors the slice-3 RoutesTabComponent shape:
 *
 * - Tab-scoped CfAppServiceBindingsSignalConfigService and
 *   AppServiceBindingActionsService so per-binding transition state and
 *   filter/sort/page reset cleanly between apps.
 * - Triggers an explicit `serviceBindings` fetch on mount (not on the
 *   focus-poll cadence; the tab is read-modify, not continuous-read).
 * - Wraps the config service's no-confirm Unbind with a confirmation
 *   dialog and adds an Edit row action (navigation only — to the SI edit
 *   stepper at /services/:type/:cnsi/:siGuid/edit). On unbind success
 *   calls dataService.removeServiceBinding(guid) so the row disappears
 *   synchronously without a re-fetch round-trip.
 * - L5 sub-nav row above the list shows the count + a Bind Service
 *   action (gated by SERVICE_INSTANCE_CREATE on the app's space).
 */
@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AppServiceBindingActionsService,
    CfAppServiceBindingsSignalConfigService,
  ],
  imports: [
    SignalListComponent,
    ListSubNavComponent,
  ],
})
export class ServicesTabComponent implements OnInit {
  private readonly dataService = inject(AppDetailDataService);
  private readonly appService = inject(ApplicationService);
  private readonly bindingsConfig = inject(CfAppServiceBindingsSignalConfigService);
  private readonly actionsService = inject(AppServiceBindingActionsService);
  private readonly permissions = inject(CurrentUserPermissionsService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(TailwindSnackBarService);
  private readonly router = inject(Router);

  /** Loading projection for the signal-list framework. */
  private readonly _isAnyLoading: Signal<boolean> = computed(
    () => this.dataService.loading().serviceBindings,
  );
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  readonly listConfig: SignalListConfig<StServiceCredentialBinding>;

  /** Reactive count of attached service bindings — surfaces to the L5
   *  sub-nav row. Same source signal that powered the bug-fix in the
   *  prior commit (services count derived from
   *  AppDetailDataService.serviceBindingsCount). */
  readonly totalServices: Signal<number> = this.dataService.serviceBindingsCount;

  /** Permission-gated visibility for the Bind Service action. Bindings
   *  require SERVICE_INSTANCE_CREATE permission on the app's space —
   *  same predicate the legacy ngrx list-config exposed before it was
   *  retired in Stage 9d. */
  private readonly canBindSignal: Signal<boolean> = toSignal(
    this.appService.waitForAppEntity$.pipe(
      switchMap(app => this.permissions.can(
        CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE,
        this.appService.cfGuid,
        app.entity.entity.space_guid,
      )),
    ),
    { initialValue: false },
  );

  readonly bindServiceAction: ListSubNavAddAction = {
    label: 'Bind Service',
    icon: 'add',
    invoke: () => {
      void this.router.navigate([
        '/applications', this.appService.cfGuid, this.appService.appGuid, 'bind',
      ]);
    },
    visible: this.canBindSignal,
  };

  constructor() {
    // Build columns from the config service then replace the actions
    // column's factory with our confirm-wrapped version + Edit nav.
    const baseColumns = this.bindingsConfig.buildColumns();
    const columns: SignalListColumn<StServiceCredentialBinding>[] = baseColumns.map(col => {
      if (col.key === 'actions' && col.kind === 'actions') {
        return { ...col, actions: this.buildRowActions };
      }
      return col;
    });

    this.listConfig = {
      pagedItems: this.bindingsConfig.view.pagedItems,
      totalFilteredResults: this.bindingsConfig.view.totalFilteredResults,
      totalPages: this.bindingsConfig.view.totalPages,
      pageIndex: this.bindingsConfig.pageIndex,
      pageSize: this.bindingsConfig.pageSize,
      isAnyLoading: this._isAnyLoading,
      errorsByCnsi: this._errorsByCnsi.asReadonly(),
      columns,
      getRowKey: (row: StServiceCredentialBinding) => row.guid,
      emptyMessage: 'This application has no bound service instances',
      emptyFilterMessage: 'No service bindings match the current filter',
      loadingMessage: 'Loading service bindings…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.bindingsConfig.nameFilter,
      onRefresh: () => this.bindingsConfig.refresh(),
      onClear: () => this.bindingsConfig.clearFilters(),
      viewMode: this.bindingsConfig.viewMode,
      sort: this.bindingsConfig.sort,
    };
  }

  ngOnInit(): void {
    // Bindings are not auto-polled — fetch on tab mount. Idempotent;
    // re-mounting the tab while already loaded just refreshes.
    void this.dataService.refresh('serviceBindings');
  }

  /**
   * Per-row action factory. Edit navigates to the existing
   * AddServiceInstanceComponent in edit mode (legacy URL shape preserved
   * so the stepper's existing wiring just works). Unbind wraps the
   * config service's verb with a confirmation dialog and evicts the row
   * from the local cache on success so the list updates without a
   * re-fetch round-trip.
   */
  private readonly buildRowActions = (
    row: StServiceCredentialBinding,
  ): readonly SignalListRowAction<StServiceCredentialBinding>[] => {
    const disabled = this.actionsService.inFlight();
    const isUserProvided = row.serviceInstance?.type === 'user-provided';
    const siType = isUserProvided ? SERVICE_INSTANCE_TYPES.USER_SERVICE : SERVICE_INSTANCE_TYPES.SERVICE;
    const cancelUrl = `/applications/${this.appService.cfGuid}/${this.appService.appGuid}/services`;
    const siName = row.serviceInstance?.name ?? 'this service';
    return [
      {
        label: 'Edit', icon: 'edit',
        disabled,
        invoke: () => {
          if (!row.serviceInstance?.guid) return;
          void this.router.navigate(
            ['/services', siType, this.appService.cfGuid, row.serviceInstance.guid, 'edit'],
            {
              queryParams: {
                appId: this.appService.appGuid,
                [CSI_CANCEL_URL]: cancelUrl,
              },
            },
          );
        },
      },
      {
        label: 'Unbind', icon: 'block', danger: true,
        disabled,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Unbind Service?',
            `Are you sure you want to unbind "${siName}" from this application?`,
            'Unbind',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.actionsService.unbindService(row.guid);
              this.dataService.removeServiceBinding(row.guid);
            } catch (err: unknown) {
              const msg = (err as { message?: string })?.message ?? String(err);
              this.snackBar.error(`Unbind failed: ${msg}`);
            }
          });
        },
      },
    ];
  };
}
