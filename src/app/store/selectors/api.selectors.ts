import { EntitiesState } from '../types/entity.types';
import { APIResource, APIResourceMetadata } from '../types/api.types';
import { compose, createFeatureSelector, createSelector } from '@ngrx/store';
import { EntityRequestState, ActionState } from '../reducers/api-request-reducer';
import { AppState } from '../app-state';


export const selectEntities = createFeatureSelector<EntitiesState>('entities');

export const createEntitySelector = (entity: string) => {
  return createSelector(selectEntities, (state: EntitiesState) => state[entity]);
};

export function selectEntity(type: string, guid: string) {
  return compose(
    getEntityById<APIResource>(guid),
    getEntityType(type),
    getEntityState
  );
}

export function selectEntityDeletionInfo(type: string, entityGuid: string) {
  return compose(
    getEntityDeleteSections,
    getEntityById<EntityRequestState>(entityGuid),
    getEntityType(type),
    getAPIRequestInfoState,
  );
}

export function selectEntityUpdateInfo(type: string, entityGuid: string, updatingGuid: string) {
  return compose(
    getUpdateSectionById(updatingGuid),
    getEntityUpdateSections,
    getEntityById<EntityRequestState>(entityGuid),
    getEntityType(type),
    getAPIRequestInfoState,
  );
}

export function selectEntityRequestInfo(type: string, guid: string) {
  return compose(
    getEntityById<EntityRequestState>(guid),
    getEntityType(type),
    getAPIRequestInfoState,
  );
}

export function getEntityState(state: AppState) {
  return state.entities;
}

export function getEntityType(type: string) {
  return (entityState) => {
    return entityState[type] || {};
  };
}

export const getEntityById = <T>(guid: string) => (entities): T => {
  return entities[guid];
};

export const getEntityUpdateSections = (request: EntityRequestState) => {
  return request ? request.updating : false;
};

export const getEntityDeleteSections = (request: EntityRequestState) => {
  return request.deleting;
};

export const getUpdateSectionById = (guid: string) => (updating): ActionState => {
  return updating[guid];
};

const getValueOrNull = (object, key) => object ? object[key] ? object[key] : null : null;
export const getAPIResourceMetadata = (resource: APIResource): APIResourceMetadata => getValueOrNull(resource, 'metadata');
export const getAPIResourceEntity = (resource: APIResource): any => getValueOrNull(resource, 'entity');
export const getMetadataGuid = (metadata: APIResourceMetadata): string => getValueOrNull(metadata, 'guid');
export const getAPIResourceGuid = compose(
  getMetadataGuid,
  getAPIResourceMetadata
);

export function getAPIRequestInfoState(state: AppState) {
  return state.apiRequest || {};
}
