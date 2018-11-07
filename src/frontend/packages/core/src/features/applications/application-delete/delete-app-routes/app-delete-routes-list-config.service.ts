import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import {
  CfAppRoutesListConfigService,
} from '../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { ApplicationService } from '../../application.service';
import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { ListView } from '../../../../../../store/src/actions/list.actions';
import { AppState } from '../../../../../../store/src/app-state';

@Injectable()
export class AppDeleteRoutesListConfigService extends CfAppRoutesListConfigService {
  serviceInstanceColumns: ITableColumn<APIResource<IServiceInstance>>[];
  defaultView: ListView;
  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService
  ) {
    super(store, appService, confirmDialog);
    this.getGlobalActions = () => null;
    this.getMultiActions = () => null;
    this.getSingleActions = () => null;
    this.allowSelection = true;
  }
}
