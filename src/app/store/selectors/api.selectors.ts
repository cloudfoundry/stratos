import { EntitiesState } from '../types/entity.types';
import { APIResource, APIResourceMetadata } from '../types/api.types';
import { compose, createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, IRequestState, IStateHasEntities } from '../app-state';
import { ActionState, EntityRequestState, UpdatingSection } from '../reducers/api-request-reducer/types';


export const selectEntities = createFeatureSelector<EntitiesState>('entities');

export const createEntitySelector = (entity: string) => {
  return createSelector(selectEntities, (state: EntitiesState) => state[entity]);
};

export function selectEntity(type: string, guid: string) {
  return compose(
    getEntityById<APIResource>(guid),
    getRequestType(type),
    getEntityState
  );
}

export function selectDeletionInfo(type: string, entityGuid: string, section?: string) {
  return compose(
    getEntityDeleteSections,
    getEntityById<EntityRequestState>(entityGuid),
    getRequestType(type),
    getRequestBySection(section),
  );
}

export function selectUpdateInfo(type: string, entityGuid: string, updatingGuid: string, section?: string) {
  return compose(
    getUpdateSectionById(updatingGuid),
    getEntityUpdateSections,
    getEntityById<EntityRequestState>(entityGuid),
    getRequestType(type),
    getRequestBySection(section),
  );
}

export function selectRequestInfo(type: string, guid: string, section?: string) {
  return compose(
    getEntityById<EntityRequestState>(guid),
    getRequestType(type),
    getRequestBySection(section)
  );
}

export function getRequestBySection(section?: string) {
  return compose(
    getRequestState(section),
    getAPIRequestInfoState
  );
}

function getRequestState(section = 'entities') {
  return function (state) {
    return state[section];
  };
}

export function getEntityState(state: IStateHasEntities) {
  return state.entities;
}

export function getRequestType(typeString: string) {
  return (requestSection) => {
    return requestSection[typeString] || {};
  };
}

export const getEntityById = <T>(guid: string) => (entities): T => {
  return entities[guid];
};

export const getEntityUpdateSections = (request: EntityRequestState): UpdatingSection => {
  return request ? request.updating : null;
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
  return state.request;
}
