import { IRequestAction } from './../types/request.types';
import { RequestOptions } from '@angular/http';
import { Action, compose, Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';

import { AppState } from '../app-state';
import { AppMetadataRequestState, AppMetadataType } from '../types/app-metadata.types';
import { PaginatedAction } from '../types/pagination.types';
import { CfAppEvnVarsDataSource } from './../../shared/data-sources/cf-app-variables-data-source';
import { selectEntity, selectRequestInfo } from '../selectors/api.selectors';

export function getPaginationKey(metadataType, cnis, guid) {
  return `${metadataType}:${cnis}:${guid}`;
}

export const AppMetadataTypes = {
  APP_METADATA: '[App Metadata] App Metadata',
  APP_METADATA_START: '[App Metadata] App Metadata start',
  APP_METADATA_SUCCESS: '[App Metadata] App Metadata success',
  APP_METADATA_FAILED: '[App Metadata] App Metadata failed'
};

export const AppMetadataProperties = {
  INSTANCES: 'instances',
  ENV_VARS: 'environmentVars',
  SUMMARY: 'summary'
};

export const EnvVarsSchema = new schema.Entity(AppMetadataProperties.ENV_VARS);

export interface IGetAppMetadataAction extends IRequestAction {
  options: RequestOptions;
  guid: string;
  cnis: string;
}

export abstract class AppMetadataAction implements Action {
  type = AppMetadataTypes.APP_METADATA;
}

export class GetAppInstancesAction extends AppMetadataAction implements PaginatedAction, IGetAppMetadataAction {
  options: RequestOptions;

  constructor(
    public guid: string,
    public cnis: string
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/stats`,
      method: 'get'
    });
    this.entityKey = AppMetadataProperties.INSTANCES;
    this.paginationKey = getPaginationKey(this.entityKey, cnis, guid);
  }
  paginationKey: string;
  type = AppMetadataTypes.APP_METADATA;
  entityKey: string;
}

export class GetAppEnvVarsAction extends AppMetadataAction implements PaginatedAction, IGetAppMetadataAction {
  options: RequestOptions;

  constructor(
    public guid: string,
    public cnis: string,
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/env`,
      method: 'get'
    });
    this.entityKey = AppMetadataProperties.ENV_VARS;
    this.paginationKey = getPaginationKey(this.entityKey, cnis, guid);
  }
  paginationKey: string;
  type = AppMetadataTypes.APP_METADATA;
  entityKey: string;
}

export class GetAppSummaryAction extends AppMetadataAction implements IGetAppMetadataAction {
  options: RequestOptions;

  constructor(
    public guid: string,
    public cnis: string,
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/summary`,
      method: 'get'
    });
    this.entityKey = AppMetadataProperties.SUMMARY;
  }
  paginationKey: string;
  type = AppMetadataTypes.APP_METADATA;
  entityKey: string;
}

export class WrapperAppMetadataStart implements Action {
  constructor(
    public appMetadataAction: IGetAppMetadataAction
  ) { }
  type = AppMetadataTypes.APP_METADATA_START;
}

export class WrapperAppMetadataSuccess implements Action {
  constructor(
    public metadata: any,
    public appMetadataAction: IGetAppMetadataAction,
  ) { }
  type = AppMetadataTypes.APP_METADATA_SUCCESS;
}

export class WrapperAppMetadataFailed implements Action {
  message: string;
  appMetedataError: AppMetedataError;

  constructor(
    public response: any,
    public appMetadataAction: IGetAppMetadataAction
  ) {
    this.appMetedataError = response._body ? JSON.parse(response._body) : response;
    this.message = this.appMetedataError.description || this.appMetedataError.message;
  }
  type = AppMetadataTypes.APP_METADATA_FAILED;
}

interface AppMetedataError {
  description?: string;
  message?: string;
  error_code?: string;
  code?: number;
}

// function getAppMetadata(state) {
//   return state.appMetadata.values || {};
// }

// function getAppRequestMetadata(state) {
//   return state.appMetadata.requests || {};
// }

// function getMetadataType<T>(metadataType) {
//   return (appMetadata): T => {
//     return appMetadata[metadataType];
//   };
// }

// function getMetadataById(appId: string) {
//   return (entities) => {
//     return entities[appId] || {};
//   };
// }

// export const selectMetadata = (metadataType: AppMetadataType, appId): any => {
//   return compose(
//     getMetadataType<any>(metadataType),
//     getMetadataById(appId),
//     getAppMetadata
//   );
// };

// export const selectMetadataRequest = (metadataType: AppMetadataType, appId): any => {
//   return compose(
//     getMetadataType<AppMetadataRequestState>(metadataType),
//     getMetadataById(appId),
//     getAppRequestMetadata
//   );
// };

export const getAppMetadataObservable = (
  store: Store<AppState>,
  appId: string,
  action: IGetAppMetadataAction
): Observable<any> => {
  return Observable.combineLatest(
    store.select(selectEntity(action.entityKey, appId)),
    store.select(selectRequestInfo(action.entityKey, appId))
  )
    .do(([metadata, metadataRequestState]) => {
      if (!metadata && (!metadataRequestState || !metadataRequestState.fetching)) { // && !dispatched
        store.dispatch(action);
      }
    })
    .filter(([metadata, metadataRequestState]) => {
      return !!(metadata || metadataRequestState);
    })
    .map(([metadata, metadataRequestState]) => ({
      metadata, metadataRequestState
    }));
};

