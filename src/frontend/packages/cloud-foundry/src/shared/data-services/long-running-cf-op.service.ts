import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { LongRunningOperationsService } from '../../../../core/src/shared/services/long-running-op.service';
import { SnackBarService } from '../../../../core/src/shared/services/snackbar.service';
import { AppState } from '../../../../store/src/app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';

@Injectable()
export class LongRunningCfOperationsService extends LongRunningOperationsService {

  constructor(
    store: Store<AppState>,
    private snackBarService: SnackBarService
  ) {
    super(store);
  }

  handleLongRunningCreateService(bindApp: boolean) {
    const message = `The operation to create the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status
    ${bindApp ? ` and then bind the application via the Application page.` : '.'}`;
    this.snackBarService.show(message, 'Dismiss');
  }

  handleLongRunningUpdateService(serviceInstanceGuid: string, cfGuid: string) {
    const message = `The operation to update the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status`;
    // Also attempt to fetch the service instance, this will update the `last operation` value to `update` and `in progress`
    this.snackBarService.show(message, 'Dismiss');
    cfEntityCatalog.serviceInstance.api.get(serviceInstanceGuid, cfGuid);
  }

  handleLongRunningDeleteService(serviceInstanceGuid: string, cfGuid: string) {
    const message = `The operation to delete the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status`;
    this.snackBarService.show(message, 'Dismiss');
    // Also attempt to fetch the service instance, this will update the `last operation` value to `delete` and `in progress`
    cfEntityCatalog.serviceInstance.api.get(serviceInstanceGuid, cfGuid);
  }

}
