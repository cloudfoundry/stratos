import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { ConfirmationDialogService, CurrentUserPermissionsService, IGlobalListAction, IListConfig } from '@stratosui/core';
import { APIResource, RouterNav } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfAppRoutesListConfigServiceBase } from './cf-app-routes-list-config-base';


@Injectable({
  providedIn: 'root'
})
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
