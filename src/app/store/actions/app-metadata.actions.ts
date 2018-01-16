import { schema } from 'normalizr';
import { PaginatedAction, PaginationParam } from '../types/pagination.types';
import { ICFAction, CFStartAction } from '../types/request.types';
import { RequestOptions } from '@angular/http';
import { getPaginationKey } from './pagination.actions';
import { AppEnvVarSchema, AppStatsSchema, AppSummarySchema, AppStatSchema } from '../types/app-metadata.types';


// export const AppMetadataStatsTypes = {
//   TYPE: '[App Metadata] Stats',
//   START: '[App Metadata] Stats start',
//   SUCCESS: '[App Metadata] Stats success',
//   FAILED: '[App Metadata] Stats failed'
// };


// export abstract class AppMetadataAction implements Action {
//   type = AppMetadataTypes.APP_METADATA;
// }

export class GetAppStatsAction extends CFStartAction implements PaginatedAction, ICFAction {
  options: RequestOptions;
  paginationKey: string;
  constructor(
    public guid: string,
    public cnis: string
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/stats`,
      method: 'get'
    });
    this.paginationKey = getPaginationKey(this.entityKey, cnis, guid);
  }
  entity = [AppStatSchema];
  entityKey = AppStatSchema.key;
  actions = [
    '[App Metadata] Stats start',
    '[App Metadata] Stats success',
    '[App Metadata] Stats failed',
  ];
  flattenPagination: false;
  initialParams: PaginationParam; // TODO: RC
}

export class GetAppEnvVarsAction extends CFStartAction implements PaginatedAction, ICFAction {
  options: RequestOptions;
  paginationKey: string;
  constructor(
    public guid: string,
    public cnis: string,
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/env`,
      method: 'get'
    });
    this.paginationKey = getPaginationKey(this.entityKey, cnis, guid);
  }
  entity = [AppEnvVarSchema];
  entityKey = AppEnvVarSchema.key;
  actions = [
    '[App Metadata] EnvVars start',
    '[App Metadata] EnvVars success',
    '[App Metadata] EnvVars failed',
  ];
  flattenPagination: false;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}

export class GetAppSummaryAction extends CFStartAction implements ICFAction {
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
  }
  entity = [AppSummarySchema];
  entityKey = AppSummarySchema.key;
  paginationKey: string;
  actions = [
    '[App Metadata] Summary start',
    '[App Metadata] Summary success',
    '[App Metadata] Summary failed',
  ];
}

// export class WrapperAppMetadataStart implements Action {
//   constructor(
//     public appMetadataAction: IGetAppMetadataAction
//   ) { }
//   type = AppMetadataTypes.APP_METADATA_START;
// }

// export class WrapperAppMetadataSuccess implements Action {
//   constructor(
//     public metadata: any,
//     public appMetadataAction: IGetAppMetadataAction,
//   ) { }
//   type = AppMetadataTypes.APP_METADATA_SUCCESS;
// }

// export class WrapperAppMetadataFailed implements Action {
//   message: string;
//   appMetedataError: AppMetedataError;

//   constructor(
//     public response: any,
//     public appMetadataAction: IGetAppMetadataAction
//   ) {
//     this.appMetedataError = response._body ? JSON.parse(response._body) : response;
//     this.message = this.appMetedataError.description || this.appMetedataError.message;
//   }
//   type = AppMetadataTypes.APP_METADATA_FAILED;
// }

// interface AppMetedataError {
//   description?: string;
//   message?: string;
//   error_code?: string;
//   code?: number;
// }

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

// export const getAppMetadataObservable = (
//   store: Store<AppState>,
//   appId: string,
//   action: IGetAppMetadataAction
// ): Observable<any> => {
//   // If you put startWith(null) in here please fix multi-request spam on apps page.
//   return Observable.combineLatest(
//     store.select(selectEntity(action.entityKey, appId)),
//     store.select(selectRequestInfo(action.entityKey, appId))
//   )
//     .do(([metadata, metadataRequestState]) => {
//       if (!metadata && (!metadataRequestState || !metadataRequestState.fetching)) {
//         store.dispatch(action);
//       }
//     })
//     .filter(([metadata, metadataRequestState]) => {
//       return !!(metadata || metadataRequestState);
//     })
//     .map(([metadata, metadataRequestState]) => ({
//       metadata, metadataRequestState
//     }));
// };

