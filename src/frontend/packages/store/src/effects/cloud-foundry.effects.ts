import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { environment } from '../../../core/src/environments/environment.prod';
import { GET_INFO, GetCFInfo } from '../actions/cloud-foundry.actions';
import { cfInfoSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import {
    ICFAction,
    StartRequestAction,
    WrapperRequestActionFailed,
    WrapperRequestActionSuccess,
} from '../types/request.types';
import { AppState } from './../app-state';

@Injectable()
export class CloudFoundryEffects {
    proxyAPIVersion = environment.proxyAPIVersion;
    constructor(
        private http: Http,
        private actions$: Actions,
        private store: Store<AppState>
    ) { }
    // TODO(nj): do we need this?
    @Effect()
    fetchInfo$ = this.actions$.pipe(
        ofType<GetCFInfo>(GET_INFO),
        flatMap(action => {
            const actionType = 'fetch';
            const apiAction = {
                entityType: cfInfoSchemaKey,
                type: action.type
            } as ICFAction;
            this.store.dispatch(new StartRequestAction(apiAction, actionType));
            const headers = new Headers({ 'x-cap-cnsi-list': action.cfGuid });
            const requestArgs = {
                headers
            };
            const url = `/pp/${this.proxyAPIVersion}/proxy/v2/info`;
            return this.http
                .get(url, requestArgs)
                .pipe(
                    mergeMap(response => {
                        const info = response.json();
                        const mappedData = {
                            entities: { [cfInfoSchemaKey]: {} },
                            result: []
                        } as NormalizedResponse;
                        const id = action.cfGuid;

                        mappedData.entities[cfInfoSchemaKey][id] = {
                            entity: info[id],
                            metadata: {}
                        };
                        mappedData.result.push(id);
                        return [
                            new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
                        ];
                    }),
                    catchError(error => [
                        new WrapperRequestActionFailed(error.message, apiAction, actionType, {
                            endpointIds: [action.cfGuid],
                            url: error.url || url,
                            eventCode: error.status ? error.status + '' : '500',
                            message: 'Cloud Foundry Info request error',
                            error
                        })
                    ])
                );
        })
    );
}
