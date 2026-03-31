import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { RowState } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IRoute } from '../../../../cf-api.types';
import {
  CfAppRoutesListConfigServiceBase,
} from '../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config-base';
import { ApplicationService } from '../../application.service';

@Injectable({
  providedIn: 'root'
})
export class AppDeleteRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {
  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const appService = inject(ApplicationService);
    const confirmDialog = inject(ConfirmationDialogService);
    const datePipe = inject(DatePipe);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);

    super(store, appService, confirmDialog, datePipe, currentUserPermissionsService, null, false, false);

    this.setupList();
  }

  private setupList() {
    this.getDataSource().getRowState = (route: APIResource<IRoute>): Observable<RowState> =>
      observableOf({
        disabledReason: 'Route is attached to other applications',
        disabled: route && route.entity.apps ? route.entity.apps.length > 1 : false
      });
  }
}
