

// RequestTypes.FAILED


import { take, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { RequestTypes } from '../actions/request.actions';
import { WrapperRequestActionFailed } from '../types/request.types';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { SendEventAction } from '../actions/internal-events.actions';
import { InternalEventSeverity } from '../types/internal-events.types';


@Injectable()
export class EndpointApiError {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect({ dispatch: false }) endpointApiError$ = this.actions$.ofType<WrapperRequestActionFailed>(RequestTypes.FAILED).pipe(
    map(action => {
      const internalEndpointError = action.internalEndpointError;
      if (internalEndpointError) {
        const { eventCode, message, error, url } = internalEndpointError;
        internalEndpointError.endpointIds.forEach(endpoint =>
          this.store.dispatch(
            new SendEventAction(endpointSchemaKey, endpoint, {
              eventCode,
              severity: InternalEventSeverity.ERROR,
              message,
              metadata: {
                error,
                url,
              },
            }),
          ),
        );
      }
    }));
}

