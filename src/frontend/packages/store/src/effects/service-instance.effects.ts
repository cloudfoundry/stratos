import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs/operators';

import { LongRunningOperationsService } from '../../../core/src/shared/services/long-running-op.service';
import { DELETE_SERVICE_INSTANCE_ACTIONS, GetServiceInstance } from '../actions/service-instances.actions';
import { APISuccessOrFailedAction } from '../types/request.types';


@Injectable()
export class ServiceInstanceEffects {

  constructor(
    private actions$: Actions,
    private longRunningOpService: LongRunningOperationsService
  ) { }

  @Effect() updateSummary$ = this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(DELETE_SERVICE_INSTANCE_ACTIONS[2]),
    mergeMap(action => {
      if (this.longRunningOpService.isLongRunning({ message: action.response })) {
        this.longRunningOpService.handleLongRunningDeleteService();
      }
      // Also attempt to fetch the service instance, this will update the `last operation` value to `delete` and `in progress`
      return [new GetServiceInstance(action.apiAction.guid, action.apiAction.endpointGuid)];
    }),
  );
}
