import { compose } from '@ngrx/store';

import { GeneralEntityAppState, IRequestEntityTypeState as IRequestEntityKeyState, IRequestTypeState } from '../app-state';
import { EntityCatalogHelpers } from '../entity-catalog/entity-catalog.helper';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { ActionState, RequestInfoState, UpdatingSection } from '../reducers/api-request-reducer/types';
import { APIResource } from '../types/api.types';

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
  return updating ? updating[guid] : null;
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

export function selectRequestInfo(entityKeyOrConfig: string | EntityCatalogEntityConfig, entityGuid: string) {
  // Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
  const entityKey = typeof (entityKeyOrConfig) === 'string' ?
    entityKeyOrConfig :
    EntityCatalogHelpers.buildEntityKey(entityKeyOrConfig.entityType, entityKeyOrConfig.endpointType);
  return compose(
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityKey<RequestInfoState>(entityKey),
    getAPIRequestInfoState
  );
}

export function selectEntities<T = APIResource>(entityKeys: string) {
  return compose(
    getRequestEntityKey<T>(entityKeys),
    getAPIRequestDataState
  );
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

export function getAPIRequestInfoState<T extends GeneralEntityAppState>(state: T) {
  return state.request;
}

export function getAPIRequestDataState<T extends GeneralEntityAppState>(state: T) {
  return state.requestData;
}
