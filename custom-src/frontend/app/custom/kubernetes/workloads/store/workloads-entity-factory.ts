import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { addKubernetesEntitySchema, KubernetesEntitySchema } from '../../kubernetes-entity-factory';
import { HelmRelease, HelmReleaseGraph, HelmReleaseResource } from '../workload.types';

export const helmReleaseEntityKey = 'helmRelease';
export const helmReleasePodEntityType = 'helmReleasePod';
export const helmReleaseServiceEntityType = 'helmReleaseService';
export const helmReleaseGraphEntityType = 'helmReleaseGraph';
export const helmReleaseResourceEntityType = 'helmReleaseResource';

const separator = ':';
export const getHelmReleaseDetailsFromGuid = (guid: string) => {
  const parts = guid.split(separator);
  return {
    endpointId: parts[0],
    namespace: parts[1],
    releaseTitle: parts[2]
  }
}
export const getHelmReleaseId = (endpointId: string, namespace: string, name: string) => `${endpointId}${separator}${namespace}${separator}${name}`;
export const getHelmReleaseIdByObj = (entity: HelmRelease) => getHelmReleaseId(entity.endpointId, entity.namespace, entity.name);
export const getHelmReleaseGraphId = (endpointId: string, releaseTitle: string) => `${endpointId}${separator}${releaseTitle}`;
export const getHelmReleaseGraphIdByObj = (entity: HelmReleaseGraph) => getHelmReleaseGraphId(entity.endpointId, entity.releaseTitle);
export const getHelmReleaseResourceId = (endpointId: string, releaseTitle: string) => `${endpointId}${separator}${releaseTitle}`;
export const getHelmReleaseResourceIdByObj = (entity: HelmReleaseResource) => getHelmReleaseResourceId(entity.endpointId, entity.releaseTitle);

const entityCache: {
  [key: string]: EntitySchema
} = {};

entityCache[helmReleaseEntityKey] = new KubernetesEntitySchema(
  helmReleaseEntityKey,
  {},
  { idAttribute: getHelmReleaseIdByObj }
);

entityCache[helmReleaseGraphEntityType] = new KubernetesEntitySchema(
  helmReleaseGraphEntityType,
  {},
  { idAttribute: getHelmReleaseGraphIdByObj }
);

entityCache[helmReleaseResourceEntityType] = new KubernetesEntitySchema(
  helmReleaseResourceEntityType,
  {},
  { idAttribute: getHelmReleaseResourceIdByObj }
);

Object.entries(entityCache).forEach(([key, workloadSchema]) => addKubernetesEntitySchema(key, workloadSchema));

export const createHelmReleaseEntities = (): { [cacheName: string]: EntitySchema } => {
  return entityCache;
};
