import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';
import { publishReplay, refCount, switchMap } from 'rxjs/operators';

import { GetAppRoutes } from '../../../../../../../cloud-foundry/src/actions/application-service-routes.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { CurrentUserPermissions } from '../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../core/src/core/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfRoutesListConfigBase } from '../cf-routes/cf-routes-list-config-base';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';

export abstract class CfAppRoutesListConfigServiceBase extends CfRoutesListConfigBase implements IListConfig<APIResource> {

  allowSelection: boolean;
  getDataSource: () => CfAppRoutesDataSource;

  protected dataSource: CfAppRoutesDataSource;

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
        CurrentUserPermissions.APPLICATION_EDIT,
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
        const getAppRoutesAction = cfEntityCatalog.route.actions.getAllForApplication(appService.appGuid, appService.cfGuid)
        this.dataSource = new CfAppRoutesDataSource(
          store,
          appService,
          getRoutesAction || getAppRoutesAction,
          this,
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
