import { APIResource, APIResourceMetadata } from '../../../../store/src/types/api.types';

const getValueOrNull = (object: any, key: string): any =>
  object ? (object[key] ? object[key] : null) : null;
export const getAPIResourceMetadata = (
  resource: APIResource
): APIResourceMetadata => getValueOrNull(resource, 'metadata');
export const getAPIResourceEntity = (resource: APIResource): any =>
  getValueOrNull(resource, 'entity');
export const getMetadataGuid = (metadata: APIResourceMetadata): string =>
  getValueOrNull(metadata, 'guid');
// Was ngrx `compose(getMetadataGuid, getAPIResourceMetadata)` — right-to-left
// function composition, inlined now that the ngrx dependency is gone.
export const getAPIResourceGuid = (resource: APIResource): string =>
  getMetadataGuid(getAPIResourceMetadata(resource));

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
