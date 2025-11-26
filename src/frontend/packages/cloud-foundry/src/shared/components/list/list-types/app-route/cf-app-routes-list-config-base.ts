import type { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';
import { publishReplay, refCount, switchMap } from 'rxjs/operators';

import type { ConfirmationDialogService, CurrentUserPermissionsService, IListConfig } from '@stratosui/core';
import type { APIResource, PaginatedAction } from '@stratosui/store';
// eslint-disable-next-line @stratosui/no-relative-imports
import type { GetAppRoutes } from '../../../../../actions/application-service-routes.actions';
// eslint-disable-next-line @stratosui/no-relative-imports
import type { CFAppState } from '../../../../../cf-app-state';
// eslint-disable-next-line @stratosui/no-relative-imports
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
// eslint-disable-next-line @stratosui/no-relative-imports
import type { ApplicationService } from '../../../../../features/applications/application.service';
// eslint-disable-next-line @stratosui/no-relative-imports
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfRoutesListConfigBase } from '../cf-routes/cf-routes-list-config-base';
import type { ListCfRoute } from '../cf-routes/cf-routes-data-source-base';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';

export abstract class CfAppRoutesListConfigServiceBase extends CfRoutesListConfigBase implements IListConfig<APIResource> {

  allowSelection!: boolean;
  getDataSource!: () => CfAppRoutesDataSource;

  protected dataSource!: CfAppRoutesDataSource;

  /**
   * Creates an instance of CfAppRoutesListConfigServiceBase.
   * @param [hasActions=false]
   * Display the generic unmap/delete actions
   * @param [genericRouteState=true]
   * Use the generic route state which enables the route busy ux
   */
  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService,
    getRoutesAction: GetAppRoutes | PaginatedAction = null,
    hasActions = false,
    genericRouteState = true
  ) {
    const canEditAppsInSpace = hasActions ? appService.app$.pipe(
      switchMap(app => currentUserPermissionsService.can(
        CfCurrentUserPermissions.APPLICATION_EDIT,
        appService.cfGuid,
        app.entity.entity.space_guid
      )),
      publishReplay(1),
      refCount(),
    ) : observableOf(false);
    super(store, confirmDialog, appService.cfGuid, datePipe, true, hasActions, () => canEditAppsInSpace, canEditAppsInSpace, true);

    this.setupBaseList(store, appService, getRoutesAction, genericRouteState);
  }

  private setupBaseList(
    store: Store<CFAppState>,
    appService: ApplicationService,
    getRoutesAction: GetAppRoutes | PaginatedAction,
    genericRouteState: boolean) {
    this.getDataSource = () => {
      // Lazy init so that any changes to the columns & data functions (like sort) are correctly applied
      if (!this.dataSource) {
        const getAppRoutesAction = cfEntityCatalog.route.actions.getAllForApplication(appService.appGuid, appService.cfGuid);
        this.dataSource = new CfAppRoutesDataSource(
          store,
          appService,
          getRoutesAction || getAppRoutesAction,
          this as unknown as IListConfig<APIResource<ListCfRoute>>,
          genericRouteState
        );
      }
      return this.dataSource;
    };
    this.allowSelection = true;
    // Remove the 'attached apps' pills
    this.columns.splice(this.columns.findIndex(column => column.columnId === CfRoutesListConfigBase.columnIdMappedApps), 1);
  }
}
