import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { DELETE_SERVICE_INSTANCE_ACTIONS } from '../../actions/service-instances.actions';
import { LongRunningCfOperationsService } from '../../shared/data-services/long-running-cf-op.service';



@Injectable({
  providedIn: 'root'
})
export class ServiceInstanceEffects {

  constructor(
    private actions$: Actions,
    private longRunningOpService: LongRunningCfOperationsService
  ) { }

   updateSummary$ = createEffect(() => this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(DELETE_SERVICE_INSTANCE_ACTIONS[2]),
    mergeMap((action): typeof EMPTY => {
      if (this.longRunningOpService.isLongRunning({ message: action.response })) {
        this.longRunningOpService.handleLongRunningDeleteService(action.apiAction.guid, action.apiAction.endpointGuid);
      }
      return EMPTY;
    }),
  ), { dispatch: false });
}
