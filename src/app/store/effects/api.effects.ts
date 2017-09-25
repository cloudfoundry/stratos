import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { Injectable } from '@angular/core';
import { Headers, Http, Request, Response } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { normalize } from 'normalizr';
import { Observable } from 'rxjs/Observable';

import { environment } from './../../../environments/environment';
import {
    APIAction,
    ApiActionTypes,
    APIResource,
    StartAPIAction,
    WrapperAPIActionFailed,
    WrapperAPIActionSuccess,
} from './../actions/api.actions';
import { AppState } from './../app-state';
import { CNSISModel } from './../reducers/cnsis.reducer';

const { proxyAPIVersion, cfAPIVersion } = environment;
@Injectable()
export class APIEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() apiRequestStart$ = this.actions$.ofType<APIAction>(ApiActionTypes.API_REQUEST)
    .map(apiAction => {
      return new StartAPIAction(apiAction);
    });

  @Effect() apiRequest$ = this.actions$.ofType<StartAPIAction>(ApiActionTypes.API_REQUEST_START)
    .withLatestFrom(this.store)
    .mergeMap(([action, state]) => {
      const { apiAction } = action;
      this.store.dispatch(this.getActionFromString(apiAction.actions[0]));

      apiAction.options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${apiAction.options.url}`;
      apiAction.options.headers = this.addBaseHeaders(apiAction.cnis || state.cnsis.entities, apiAction.options.headers);

      return this.http.request(new Request(apiAction.options))
        .mergeMap(response => {
          const entities = this.getEntities(apiAction, response);
          return Observable.of(
            new WrapperAPIActionSuccess(
              apiAction.actions[1],
              entities,
              apiAction
            )
          );
        })
        .catch(err => {
          return Observable.of(new WrapperAPIActionFailed(apiAction.actions[2], err, apiAction));
        });
    });

  private completeResourceEntity(resource: APIResource | any, cfGuid: string): APIResource {
    if (!resource) {
      return resource;
    }
    return resource.metadata ? {
      entity: { ...resource.entity, guid: resource.metadata.guid, cfGuid },
      metadata: resource.metadata
    } : {
        entity: { ...resource, cfGuid },
        metadata: { guid: resource.guid }
      };
  }

  getEntities(apiAction: APIAction, response: Response) {
    const data = response.json();
    const allEntities = Object.keys(data).map(cfGuid => {
      const cfData = data[cfGuid];
      if (cfData.resources) {
        if (!cfData.resources.length) {
          return null;
        }

        return cfData.resources.map(resource => {
          return this.completeResourceEntity(resource, cfGuid);
        });
      } else {
        return this.completeResourceEntity(cfData, cfGuid);
      }
    });
    const flatEntities = [].concat(...allEntities).filter(e => !!e);
    return flatEntities.length ? normalize(flatEntities, apiAction.entity) : {};
  }

  mergeData(entity, metadata, cfGuid) {
    return { ...entity, ...metadata, cfGuid };
  }

  getDataFromResponse(response: Response) {
    response.json();
  }

  addBaseHeaders(cnsis: CNSISModel[] | string, header: Headers): Headers {
    const cnsiHeader = 'x-cap-cnsi-list';
    const headers = new Headers();
    if (typeof cnsis === 'string') {
      headers.set(cnsiHeader, cnsis);
    } else {
      headers.set(cnsiHeader, cnsis.filter(c => c.registered).map(c => c.guid));
    }
    return headers;
  }

  getActionFromString(type: string) {
    return { type };
  }

}
