import { CfEntityDataState } from '../types/entity.types';
import { APIResource, APIResourceMetadata } from '../types/api.types';
import { compose, createFeatureSelector, createSelector } from '@ngrx/store';
import {
  AppState,
  IRequestTypeState,
  IRequestEntityTypeState,
  IRequestDataState,
  IRequestState,
} from '../app-state';
import {
  ActionState,
  RequestSectionKeys,
  RequestInfoState,
  TRequestTypeKeys,
  UpdatingSection,
} from '../reducers/api-request-reducer/types';

export const getEntityById = <T>(guid: string) => (entities): T => {
  return entities[guid];
};

export const getEntityDeleteSections = (request: RequestInfoState) => {
  return request.deleting;
};

export const getEntityUpdateSections = (request: RequestInfoState): UpdatingSection => {
  return request ? request.updating : null;
};

export const getUpdateSectionById = (guid: string) => (updating): ActionState => {
  return updating[guid];
};

export function selectUpdateInfo(
  entityType: string,
  entityGuid: string,
  updatingKey: string,
  requestType: TRequestTypeKeys = RequestSectionKeys.CF
) {
  return compose(
    getUpdateSectionById(updatingKey),
    getEntityUpdateSections,
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityType<RequestInfoState>(entityType),
    getRequestInfoByRequestType(requestType),
  );
}
export function selectDeletionInfo(entityType: string, entityGuid: string, requestType = RequestSectionKeys.CF) {
  return compose(
    getEntityDeleteSections,
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityType<RequestInfoState>(entityType),
    getRequestInfoByRequestType(requestType),
  );
}

export function selectRequestInfo(entityKey: string, entityGuid: string, requestType = RequestSectionKeys.CF) {
  return compose(
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityType<RequestInfoState>(entityKey),
    getRequestInfoByRequestType(requestType),
  );
}

export function selectEntities<T = APIResource>(entityType: string, requestType: TRequestTypeKeys = RequestSectionKeys.CF) {
  return compose(
    getRequestEntityType<T>(entityType),
    getRequestDataTypeState(requestType)
  );
}

export function selectEntity<T = APIResource>(entityType: string, guid: string, requestType: TRequestTypeKeys = RequestSectionKeys.CF) {
  return compose(
    getEntityById<T>(guid),
    getRequestEntityType<T>(entityType),
    getRequestDataTypeState(requestType),
  );
}

// T can equal CNSISModel
export function getRequestDataByRequestType<T>(requestType: TRequestTypeKeys = RequestSectionKeys.CF) {
  return compose(
    getRequestType<IRequestDataState>(requestType),
    getAPIRequestDataState
  );
}

export function getRequestInfoByRequestType(requestType: TRequestTypeKeys = RequestSectionKeys.CF) {
  return compose(
    getRequestType<IRequestState>(requestType),
    getAPIRequestInfoState
  );
}

export function getRequestDataTypeState(requestType: TRequestTypeKeys = RequestSectionKeys.CF) {
  return compose(
    getRequestType<IRequestDataState>(requestType),
    getAPIRequestDataState
  );
}

// Base selectors
// T => APIResource || base entity (e.g. CNISModel)
export function getRequestEntityType<T>(entityType: string) {
  return (state: IRequestTypeState): IRequestEntityTypeState<T> => {
    return state[entityType] || {};
  };
}
// T => IRequestState || IRequestDataState
export function getRequestType<T>(requestType: TRequestTypeKeys) {
  return (state: T): IRequestTypeState => {
    return state[requestType] || {};
  };
}

export function getAPIRequestInfoState(state: AppState) {
  return state.request;
}

export function getAPIRequestDataState(state: AppState) {
  return state.requestData;
}


// export function getRequestDataType<T>(typeString: string) {
//   return (requestDataSection: IRequestDataState): IBaseEntityTypeState<T> => {
//     return requestDataSection[typeString] || {};
//   };
// }

const getValueOrNull = (object, key) => object ? object[key] ? object[key] : null : null;
export const getAPIResourceMetadata = (resource: APIResource): APIResourceMetadata => getValueOrNull(resource, 'metadata');
export const getAPIResourceEntity = (resource: APIResource): any => getValueOrNull(resource, 'entity');
export const getMetadataGuid = (metadata: APIResourceMetadata): string => getValueOrNull(metadata, 'guid');
export const getAPIResourceGuid = compose(
  getMetadataGuid,
  getAPIResourceMetadata
);


