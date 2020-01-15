import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { addKubernetesEntitySchema, KubernetesEntitySchema } from '../../kubernetes-entity-factory';
import { HelmRelease, HelmReleaseGraph, HelmReleaseResource, HelmReleaseService } from '../workload.types';

export const helmReleaseEntityKey = 'helmRelease';
export const helmReleasePodEntityType = 'helmReleasePod';
export const helmReleaseServiceEntityType = 'helmReleaseService';
export const helmReleaseGraphEntityType = 'helmReleaseGraph';
export const helmReleaseResourceEntityType = 'helmReleaseResource';

export const getHelmReleaseId = (entity: HelmRelease) => `${entity.endpointId}-${entity.namespace}-${entity.name}`;
export const getHelmReleaseServiceId =
  (entity: HelmReleaseService) => `${entity.endpointId}-${entity.releaseTitle}-${entity.metadata.name}`;
export const getHelmReleaseGraphId = (entity: HelmReleaseGraph) => `${entity.endpointId}-${entity.releaseTitle}`;
export const getHelmReleaseResourceId = (entity: HelmReleaseResource) => `${entity.endpointId}-${entity.releaseTitle}`;

const entityCache: {
  [key: string]: EntitySchema
} = {};

entityCache[helmReleaseEntityKey] = new KubernetesEntitySchema(
  helmReleaseEntityKey,
  {},
  { idAttribute: getHelmReleaseId }
);

entityCache[helmReleaseGraphEntityType] = new KubernetesEntitySchema(
  helmReleaseGraphEntityType,
  {},
  { idAttribute: getHelmReleaseGraphId }
);

entityCache[helmReleaseResourceEntityType] = new KubernetesEntitySchema(
  helmReleaseResourceEntityType,
  {},
  { idAttribute: getHelmReleaseResourceId }
);

Object.entries(entityCache).forEach(([key, workloadSchema]) => addKubernetesEntitySchema(key, workloadSchema));

export const createHelmReleaseEntities = (): { [cacheName: string]: EntitySchema } => {
  return entityCache;
};
