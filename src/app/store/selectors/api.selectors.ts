import { APIResource, APIResourceMetadata } from '../types/api.types';
import { compose, createFeatureSelector, createSelector } from '@ngrx/store';
import {
  AppState,
  IRequestTypeState,
  IRequestEntityTypeState,
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
  updatingKey: string
) {
  return compose(
    getUpdateSectionById(updatingKey),
    getEntityUpdateSections,
    selectRequestInfo(entityType, entityGuid)
  );
}
export function selectDeletionInfo(entityType: string, entityGuid: string) {
  return compose(
    getEntityDeleteSections,
    selectRequestInfo(entityType, entityGuid)
  );
}

export function selectRequestInfo(entityType: string, entityGuid: string) {
  return compose(
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityType<RequestInfoState>(entityType),
    getAPIRequestDataState
  );
}

export function selectEntities<T = APIResource>(entityType: string) {
  return compose(
    getRequestEntityType<T>(entityType),
    getAPIRequestDataState
  );
}

export function selectEntity<T = APIResource>(entityType: string, guid: string) {
  return compose(
    getEntityById<T>(guid),
    getRequestEntityType<T>(entityType),
    getAPIRequestDataState,
  );
}

// Base selectors
// T => APIResource || base entity (e.g. CNISModel)
export function getRequestEntityType<T>(entityType: string) {
  return (state: IRequestTypeState): IRequestEntityTypeState<T> => {
    return state[entityType] || {};
  };
}

export function getAPIRequestInfoState(state: AppState) {
  return state.request;
}

export function getAPIRequestDataState(state: AppState) {
  return state.requestData;
}


const getValueOrNull = (object, key) => object ? object[key] ? object[key] : null : null;
export const getAPIResourceMetadata = (resource: APIResource): APIResourceMetadata => getValueOrNull(resource, 'metadata');
export const getAPIResourceEntity = (resource: APIResource): any => getValueOrNull(resource, 'entity');
export const getMetadataGuid = (metadata: APIResourceMetadata): string => getValueOrNull(metadata, 'guid');
export const getAPIResourceGuid = compose(
  getMetadataGuid,
  getAPIResourceMetadata
);


