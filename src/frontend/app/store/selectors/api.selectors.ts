import { compose } from '@ngrx/store';

import { AppState, IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { ActionState, RequestInfoState, UpdatingSection } from '../reducers/api-request-reducer/types';
import { APIResource, APIResourceMetadata } from '../types/api.types';

export const getEntityById = <T>(guid: string) => (entities): T => {
  return entities[guid];
};

export const getNestedEntityWithKeys = <T>(entityKeys: string[]) => (
  entities
): T => {
  let entity = entities;
  entityKeys.forEach(k => entity = entity[k]);
  return entity;
};

export const getEntityDeleteSections = (request: RequestInfoState) => {
  return request.deleting;
};

export const getEntityUpdateSections = (
  request: RequestInfoState
): UpdatingSection => {
  return request ? request.updating : null;
};

export const getUpdateSectionById = (guid: string) => (
  updating
): ActionState => {
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
    getAPIRequestInfoState
  );
}

export function selectEntities<T = APIResource>(entityType: string) {
  return compose(getRequestEntityType<T>(entityType), getAPIRequestDataState);
}

export function selectEntity<T = APIResource>(
  entityType: string,
  guid: string
) {
  return compose(
    getEntityById<T>(guid),
    getRequestEntityType<T>(entityType),
    getAPIRequestDataState
  );
}

export function selectNestedEntity<T = APIResource[]>(
  entityType: string,
  guid: string,
  entityKeys: string[]
) {
  return compose(
    getNestedEntityWithKeys<T>([guid, ...entityKeys]),
    getRequestEntityType<T>(entityType),
    getAPIRequestDataState
  );
}

// Base selectors
// T => APIResource || base entity (e.g. EndpointModel)
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

const getValueOrNull = (object, key) =>
  object ? (object[key] ? object[key] : null) : null;
export const getAPIResourceMetadata = (
  resource: APIResource
): APIResourceMetadata => getValueOrNull(resource, 'metadata');
export const getAPIResourceEntity = (resource: APIResource): any =>
  getValueOrNull(resource, 'entity');
export const getMetadataGuid = (metadata: APIResourceMetadata): string =>
  getValueOrNull(metadata, 'guid');
export const getAPIResourceGuid = compose(
  getMetadataGuid,
  getAPIResourceMetadata
);
