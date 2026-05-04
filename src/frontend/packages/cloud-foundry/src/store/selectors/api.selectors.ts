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

const getValueOrNull = (object: any, key: string): any =>
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

// FWT-934: composite entity ID for CF entities that carry cfGuid on their
// `entity` slice. Returns `${cfGuid}:${guid}` when both are present, bare
// guid as a migration-period fallback when cfGuid is missing or empty. The
// fallback path is unsafe under duplicate-URL endpoints (the whole point of
// the composite) — once Phase 5 guarantees every CF entity construction
// populates cfGuid, we can harden the fallback to throw + StError.
export const getCFCompositeEntityId = (resource: APIResource): string => {
  const guid = getAPIResourceGuid(resource);
  if (!guid) return guid;
  const cfGuid = resource?.entity?.cfGuid;
  if (!cfGuid) return guid;
  return `${cfGuid}:${guid}`;
};
