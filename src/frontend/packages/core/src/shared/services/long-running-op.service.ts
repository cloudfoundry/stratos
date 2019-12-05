import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ShowSnackBar } from '../../../../store/src/actions/snackBar.actions';
import { AppState } from '../../../../store/src/app-state';

@Injectable()
export class LongRunningOperationsService {

  constructor(private store: Store<AppState>) { }

  isLongRunning(request: Partial<{ message: string }>) {
    return request.message === 'Long Running Operation still active';
  }

  handleLongRunningCreateService(bindApp: boolean) {
    const message = `The operation to create the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check on it's state
    ${bindApp ? ` and then bind the application via the Application page.` : '.'}`;
    this.store.dispatch(new ShowSnackBar(message, 'Dismiss'));
  }

  handleLongRunningUpdateService() {
    const message = `The operation to update the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check on it's state`;
    this.store.dispatch(new ShowSnackBar(message, 'Dismiss'));
  }

  handleLongRunningDeleteService() {
    const message = `The operation to delete the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check on it's state`;
    this.store.dispatch(new ShowSnackBar(message, 'Dismiss'));
  }

}
