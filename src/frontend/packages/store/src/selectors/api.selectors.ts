import { compose } from '@ngrx/store';

import { AppState, IRequestEntityTypeState as IRequestEntityKeyState, IRequestTypeState } from '../app-state';
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
  entityKey: string,
  entityGuid: string,
  updatingKey: string
) {
  return compose(
    getUpdateSectionById(updatingKey),
    getEntityUpdateSections,
    selectRequestInfo(entityKey, entityGuid)
  );
}
export function selectDeletionInfo(entityKey: string, entityGuid: string) {
  return compose(
    getEntityDeleteSections,
    selectRequestInfo(entityKey, entityGuid)
  );
}

export function selectRequestInfo(entityKeys: string, entityGuid: string) {
  return compose(
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityKey<RequestInfoState>(entityKeys),
    getAPIRequestInfoState
  );
}

export function selectEntities<T = APIResource>(entityKeys: string) {
  return compose(getRequestEntityKey<T>(entityKeys), getAPIRequestDataState);
}

export function selectEntity<T = APIResource>(
  entityKey: string,
  guid: string
) {
  return compose(
    getEntityById<T>(guid),
    getRequestEntityKey<T>(entityKey),
    getAPIRequestDataState
  );
}

export function selectNestedEntity<T = APIResource[]>(
  entityKey: string,
  guid: string,
  entityTypes: string[]
) {
  return compose(
    getNestedEntityWithKeys<T>([guid, ...entityTypes]),
    getRequestEntityKey<T>(entityKey),
    getAPIRequestDataState
  );
}

// Base selectors
// T => APIResource || base entity (e.g. EndpointModel)
export function getRequestEntityKey<T>(entityKey: string) {
  return (state: IRequestTypeState): IRequestEntityKeyState<T> => {
    return state[entityKey] || {} as IRequestEntityKeyState<T>;
  };
}

export function getAPIRequestInfoState<T>(state: AppState<T>) {
  return state.request;
}

export function getAPIRequestDataState<T>(state: AppState<T>) {
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
