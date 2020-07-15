import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { SendEventAction } from '../actions/internal-events.actions';
import { RequestTypes } from '../actions/request.actions';
import { InternalAppState } from '../app-state';
import { endpointEntityType } from '../helpers/stratos-entity-factory';
import { InternalEventSeverity } from '../types/internal-events.types';
import { WrapperRequestActionFailed } from '../types/request.types';

@Injectable()
export class EndpointApiError {

  constructor(
    private actions$: Actions,
    private store: Store<InternalAppState>,
  ) { }

  @Effect({ dispatch: false }) endpointApiError$ = this.actions$.pipe(
    ofType<WrapperRequestActionFailed>(RequestTypes.FAILED),
    map(action => {
      const internalEndpointError = action.internalEndpointError;
      if (internalEndpointError) {
        const { eventCode, message, error, url } = internalEndpointError;
        internalEndpointError.endpointIds.forEach(endpoint =>
          this.store.dispatch(
            new SendEventAction(endpointEntityType, endpoint, {
              eventCode,
              severity: InternalEventSeverity.ERROR,
              message,
              metadata: {
                httpMethod: action.apiAction.options ? action.apiAction.options.method : '',
                errorResponse: error,
                // FIXME We can do a better job at displaying the full url once
                // the angular 8 HttpClient migration is done.
                // action.apiAction.options
                url,
              },
            }),
          ),
        );
      }
    }));
}
