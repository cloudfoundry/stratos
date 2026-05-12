import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { DELETE_SERVICE_INSTANCE_ACTIONS } from '../../actions/service-instances.actions';
import { LongRunningCfOperationsService } from '../../shared/data-services/long-running-cf-op.service';



// CF effects retention (wave-3 CF-effects audit, 2026-05-12):
// Retained defensively — DELETE_SERVICE_INSTANCE_ACTIONS[2] (success)
// would fire whenever a DeleteServiceInstance action runs through the
// CF request pipeline. The current UI delete path now bypasses the
// store entirely (V3 async-job HTTP DELETE in
// cf-service-instances-signal-config.service.ts:291), so today this
// effect's listener has no live producer. The action class +
// serviceInstance.api.remove builder remain wired in the catalogue
// however, so any future caller of cfEntityCatalog.serviceInstance.api.remove
// would re-activate the dispatch. Effect kept until the action +
// builder are jettisoned in a follow-up cleanup (out of scope here).
@Injectable({
  providedIn: 'root'
})
export class ServiceInstanceEffects {
  private actions$ = inject(Actions);
  private longRunningOpService = inject(LongRunningCfOperationsService);
  private appRef = inject(ApplicationRef);


   updateSummary$ = createEffect(() => this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(DELETE_SERVICE_INSTANCE_ACTIONS[2]),
    mergeMap((action): typeof EMPTY => {
      if (this.longRunningOpService.isLongRunning({ message: action.response })) {
        this.longRunningOpService.handleLongRunningDeleteService(action.apiAction.guid, action.apiAction.endpointGuid);
      }
      this.appRef.tick();
      return EMPTY;
    }),
  ), { dispatch: false });
}
