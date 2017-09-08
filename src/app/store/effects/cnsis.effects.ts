import { GET_CNSIS, GetAllCNSIS, GetAllCNSISFailed, GetAllCNSISSuccess } from './../actions/cnsis.actions';
import { AppState } from './../app-state';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';


@Injectable()
export class CNSISEffect {

    constructor(
        private http: Http,
        private actions$: Actions,
        private store: Store<AppState>
    ) { }

    @Effect() getAllCNSIS$ = this.actions$.ofType<GetAllCNSIS>(GET_CNSIS)
        .switchMap(action => {
            return this.http.get('/pp/v1/cnsis')
                .map(data => new GetAllCNSISSuccess(data.json(), action.login))
                .catch((err, caught) => [new GetAllCNSISFailed(err.message, action.login)]);
        });

}
