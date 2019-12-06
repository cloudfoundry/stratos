import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { GetServiceInstance } from '../../../../store/src/actions/service-instances.actions';
import { ShowSnackBar } from '../../../../store/src/actions/snackBar.actions';
import { AppState } from '../../../../store/src/app-state';
import { LongRunningOperationsService } from './long-running-op.service';

@Injectable()
export class LongRunningCfOperationsService extends LongRunningOperationsService {

  constructor(store: Store<AppState>) {
    super(store);
  }

  handleLongRunningCreateService(bindApp: boolean) {
    const message = `The operation to create the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status
    ${bindApp ? ` and then bind the application via the Application page.` : '.'}`;
    this.store.dispatch(new ShowSnackBar(message, 'Dismiss'));
  }

  handleLongRunningUpdateService(serviceInstanceGuid: string, cfGuid: string) {
    const message = `The operation to update the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status`;
    this.store.dispatch(new ShowSnackBar(message, 'Dismiss'));
    // Also attempt to fetch the service instance, this will update the `last operation` value to `update` and `in progress`
    this.store.dispatch(new GetServiceInstance(serviceInstanceGuid, cfGuid));
  }

  handleLongRunningDeleteService(serviceInstanceGuid: string, cfGuid: string) {
    const message = `The operation to delete the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status`;
    this.store.dispatch(new ShowSnackBar(message, 'Dismiss'));
    // Also attempt to fetch the service instance, this will update the `last operation` value to `delete` and `in progress`
    this.store.dispatch(new GetServiceInstance(serviceInstanceGuid, cfGuid));
  }

}
