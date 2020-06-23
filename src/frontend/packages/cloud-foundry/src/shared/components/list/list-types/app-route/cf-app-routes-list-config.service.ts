import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { IGlobalListAction, IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppRoutesListConfigServiceBase } from './cf-app-routes-list-config-base';


@Injectable()
export class CfAppRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {

  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super(store, appService, confirmDialog, datePipe, currentUserPermissionsService, null, true);

    this.setupList(store, appService);
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
      description: 'Add new route'
    };
    this.getGlobalActions = () => [listActionAddRoute];
  }
}
