import { CfEntitiesState } from '../types/entity.types';
import { APIResource, APIResourceMetadata } from '../types/api.types';
import { compose, createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, IRequestState, IStateHasEntities } from '../app-state';
import { ActionState, RequestState, UpdatingSection } from '../reducers/api-request-reducer/types';

export const getEntityById = <T>(guid: string) => (entities): T => {
  return entities[guid];
};

export const getEntityDeleteSections = (request: RequestState) => {
  return request.deleting;
};

export const getEntityUpdateSections = (request: RequestState): UpdatingSection => {
  return request ? request.updating : null;
};

export const getUpdateSectionById = (guid: string) => (updating): ActionState => {
  return updating[guid];
};

export function selectEntities(type: string, section = 'cf') {
  return compose(
    getRequestType(type),
    getEntityState(section)
  );
}

export function selectEntity(type: string, guid: string, section = 'cf') {
  return compose(
    getEntityById<APIResource>(guid),
    getRequestType(type),
    getEntityState(section)
  );
}

export function selectDeletionInfo(type: string, entityGuid: string, section?: string) {
  return compose(
    getEntityDeleteSections,
    getEntityById<RequestState>(entityGuid),
    getRequestType(type),
    getRequestBySection(section),
  );
}

export function selectUpdateInfo(type: string, entityGuid: string, updatingGuid: string, section?: string) {
  return compose(
    getUpdateSectionById(updatingGuid),
    getEntityUpdateSections,
    getEntityById<RequestState>(entityGuid),
    getRequestType(type),
    getRequestBySection(section),
  );
}

export function selectRequestInfo(type: string, guid: string, section?: string) {
  return compose(
    getEntityById<RequestState>(guid),
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

function getRequestState(section = 'cf') {
  return function (state) {
    return state[section];
  };
}

export function getEntityState(section = 'cf') {
  return compose(
    getRequestState(section),
    getAPIRequestDataState
  );
}

export function getRequestType(typeString: string) {
  return (requestSection) => {
    return requestSection[typeString] || {};
  };
}

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

export function getAPIRequestDataState(state: AppState) {
  return state.requestData;
}
