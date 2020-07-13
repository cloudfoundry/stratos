import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { IGlobalListAction, IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfAppRoutesListConfigServiceBase } from './cf-app-routes-list-config-base';


@Injectable()
export class CfAppRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {

  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super(store, appService, confirmDialog, datePipe, currentUserPermissionsService, null, true);

    this.setupList(store, appService);
    this.allowSelection = false; // Allow the multi action visibility to determine this
  }

  private setupList(store: Store<CFAppState>, appService: ApplicationService) {
    const listActionAddRoute: IGlobalListAction<APIResource> = {
      action: () => {
        appService.application$.pipe(
          take(1),
        ).subscribe(app => {
          store.dispatch(new RouterNav({
            path: [
              'applications',
              appService.cfGuid,
              appService.appGuid,
              'add-route'
            ],
            query: {
              spaceGuid: app.app.entity.space_guid
            }
          }));
        });
      },
      icon: 'add',
      label: 'Add',
      description: 'Add new route',
      visible$: combineLatest(
        appService.appOrg$,
        appService.appSpace$
      ).pipe(
        switchMap(([org, space]) => this.currentUserPermissionsService.can(
          CfCurrentUserPermissions.ROUTE_CREATE,
          appService.cfGuid,
          org.metadata.guid,
          space.metadata.guid
        ))
      )
    };
    this.getGlobalActions = () => [listActionAddRoute];
  }
}
