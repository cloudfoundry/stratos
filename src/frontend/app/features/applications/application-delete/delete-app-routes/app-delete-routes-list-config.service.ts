import { Injectable } from '@angular/core';
import { CfAppRoutesListConfigService } from '../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';

@Injectable()
export class AppDeleteRoutesListConfigService extends CfAppRoutesListConfigService {
  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService
  ) {
    super(store, appService, confirmDialog);
    this.getGlobalActions = () => null;
    this.getMultiActions = () => {
      return [this.multiListActionDelete];
    };

    this.getSingleActions = () => null;
  }
}
