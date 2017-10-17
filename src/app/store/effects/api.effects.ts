import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { Injectable } from '@angular/core';
import { Headers, Http, Request, RequestMethod, Response } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { normalize } from 'normalizr';
import { Observable } from 'rxjs/Observable';

import { ClearPaginationOfType, SetParams } from '../actions/pagination.actions';
import { environment } from './../../../environments/environment';
import {
  APIAction,
  ApiActionTypes,
  APIResource,
  NormalizedResponse,
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

      // Push the params to the store
      if (apiAction.paginationKey && apiAction.options && apiAction.options.params) {
        const params = {};
        apiAction.options.params.paramsMap.forEach((value, key) => {
          const paramValue = value.length === 1 ? value[0] : value;
          params[key] = paramValue;
        });
        this.store.dispatch(new SetParams(apiAction.entityKey, apiAction.paginationKey, params));
      }

      apiAction.options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${apiAction.options.url}`;
      apiAction.options.headers = this.addBaseHeaders(apiAction.cnis || state.cnsis.entities, apiAction.options.headers);

      return this.http.request(new Request(apiAction.options))
        .mergeMap(response => {
          let resData;
          try {
            resData = response.json();
          } catch (e) {
            resData = null;
          }
          if (resData) {
            const cnsisErrors = this.getErrors(resData);
            if (cnsisErrors.length) {
              // We should consider not completely failing the whole if some cnsis return.
              throw Observable.throw(`Error from cnsis: ${cnsisErrors.map(res => `${res.guid}: ${res.error}.`).join(', ')}`);
            }
          }
          const entities = resData ?
            this.getEntities(apiAction, resData) : {
              entities: {},
              result: []
            };
          const actions = [];
          actions.push(new WrapperAPIActionSuccess(
            apiAction.actions[1],
            entities,
            apiAction
          ));

          if (
            apiAction.options.method === 'post' || apiAction.options.method === RequestMethod.Post ||
            apiAction.options.method === 'delete' || apiAction.options.method === RequestMethod.Delete
          ) {
            actions.unshift(new ClearPaginationOfType(apiAction.entityKey));
          }

          return actions;
        })
        .catch(err => {
          return Observable.of(new WrapperAPIActionFailed(apiAction.actions[2], err.message, apiAction));
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

  getErrors(resData) {
    return Object.keys(resData)
      .map(guid => {
        const cnsis = resData[guid];
        cnsis.guid = guid;
        return cnsis;
      })
      .filter(cnsis => {
        return cnsis.error;
      });
  }

  getEntities(apiAction: APIAction, data): NormalizedResponse {
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
    return flatEntities.length ? normalize(flatEntities, apiAction.entity) : null;
  }

  mergeData(entity, metadata, cfGuid) {
    return { ...entity, ...metadata, cfGuid };
  }

  addBaseHeaders(cnsis: CNSISModel[] | string, header: Headers): Headers {
    const cnsiHeader = 'x-cap-cnsi-list';
    const headers = header || new Headers();
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
