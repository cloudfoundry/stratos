import { NormalizedResponse } from '../types/api.types';
import { Observable } from 'rxjs/Rx';
import {
  CONNECT_CNSIS,
  ConnectCnis,
  GET_CNSIS,
  GetAllCNSIS,
  GetAllCNSISFailed,
  GetAllCNSISSuccess,
} from './../actions/cnsis.actions';
import { AppState } from './../app-state';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { CNSISModel, cnsisStoreNames } from '../types/cnsis.types';
import {
  IAPIAction, NoneCFSuccessAction, StartNoneCFAction, WrapperNoneCFActionFailed, WrapperNoneCFActionSuccess
} from '../types/request.types';


@Injectable()
export class CNSISEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllCNSIS$ = this.actions$.ofType<GetAllCNSIS>(GET_CNSIS)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: cnsisStoreNames.type,
      } as IAPIAction;
      this.store.dispatch(new StartNoneCFAction(apiAction, actionType));
      return Observable.zip(
        this.http.get('/pp/v1/cnsis'),
        this.http.get('/pp/v1/cnsis/registered'),
        (all, registered) => {
          const allCnsis: CNSISModel[] = all.json();
          const registeredCnsis: CNSISModel[] = registered.json();

          return allCnsis.map(c => {
            c.registered = !!registeredCnsis.find(r => r.guid === c.guid);
            return c;
          });
        }
      )
        .mergeMap(data => {
          const mappedData = {
            entities: {
              cnsis: {}
            },
            result: []
          };
          data.forEach(cnsi => {
            mappedData.entities.cnsis[cnsi.guid] = cnsi;
            mappedData.result.push(cnsi.guid);
          });
          return [
            new GetAllCNSISSuccess(data, action.login),
            new WrapperNoneCFActionSuccess(mappedData, apiAction, actionType)
          ];
        })
        .catch((err, caught) => [
          new GetAllCNSISFailed(err.message, action.login),
          new WrapperNoneCFActionFailed(err.message, apiAction, actionType)
        ]);

    });

  @Effect() connectCnis$ = this.actions$.ofType<ConnectCnis>(CONNECT_CNSIS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = {
        entityKey: cnsisStoreNames.type,
        guid: action.cnsiGuid,
        updatingKey: 'connecting',
      } as IAPIAction;
      this.store.dispatch(new StartNoneCFAction(apiAction, actionType));
      return this.http.post('/pp/v1/auth/login/cnsi', {}, {
        params: {
          cnsi_guid: action.cnsiGuid,
          username: action.username,
          password: action.password
        }
      }).do(() => {
        // return this.store.dispatch(new WrapperNoneCFActionFailed('Could not connect', apiAction));
      })
        .catch(e => {
          return [new WrapperNoneCFActionFailed('Could not connect', apiAction, actionType)];
        });
    });
}
