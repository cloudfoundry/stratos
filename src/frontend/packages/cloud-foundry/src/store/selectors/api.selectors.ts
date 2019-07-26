import { compose } from '@ngrx/store';

import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import {
  getAPIRequestDataState,
  getAPIRequestInfoState,
  getEntityById,
  getEntityUpdateSections,
  getRequestEntityKey,
  getUpdateSectionById,
} from '../../../../store/src/selectors/api.selectors';
import { APIResource, APIResourceMetadata } from '../../../../store/src/types/api.types';
import { getCFEntityKey } from '../../cf-entity-helpers';

export function selectCfRequestInfo(entityType: string, entityGuid: string) {
  const entityKey = getCFEntityKey(entityType);
  return compose(
    getEntityById<RequestInfoState>(entityGuid),
    getRequestEntityKey<RequestInfoState>(entityKey),
    getAPIRequestInfoState
  );
}

export function selectCfUpdateInfo(
  entityKey: string,
  entityGuid: string,
  updatingKey: string
) {
  return compose(
    getUpdateSectionById(updatingKey),
    getEntityUpdateSections,
    selectCfRequestInfo(entityKey, entityGuid)
  );
}

export function selectCfEntity<T = APIResource>(
  entityType: string,
  guid: string
) {
  const entityKey = getCFEntityKey(entityType);
  return compose(
    getEntityById<T>(guid),
    getRequestEntityKey<T>(entityKey),
    getAPIRequestDataState
  );
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
