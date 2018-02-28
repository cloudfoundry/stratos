import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { ActionHistoryDump, ActionHistoryActions } from '../actions/action-history.actions';
import { MetricsAction, METRICS_START } from '../actions/metrics.actions';


@Injectable()
export class MetricsEffect {

    constructor(
        private actions$: Actions,
        private store: Store<AppState>,
        private httpClient: HttpClient
    ) { }

    @Effect({ dispatch: false }) metrics$ = this.actions$.ofType<MetricsAction>(METRICS_START)
        .map(action => {
            const fullUrl = this.buildFullUrl(action);
            this.httpClient.get(fullUrl, {
                headers: { 'x-cap-cnsi-list': action.cfGuid }
            }).pipe(
                map(metrics => console.log(metrics))
            );
        });

    private buildFullUrl(action: MetricsAction) {
        return `${action.url}?query=${action.query}`;
    }
}

