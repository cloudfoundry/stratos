import { Injectable } from '@angular/core';
import { CfAppRoutesListConfigService } from '../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { ListView } from '../../../../store/actions/list.actions';
import { APIResource } from '../../../../store/types/api.types';
import { CfServiceInstance } from '../../../../store/types/service.types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';

@Injectable()
export class AppDeleteRoutesListConfigService extends CfAppRoutesListConfigService {
  serviceInstanceColumns: ITableColumn<APIResource<CfServiceInstance>>[];
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
