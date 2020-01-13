import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { addKubernetesEntitySchema, KubernetesEntitySchema } from '../../kubernetes-entity-factory';
import {
  HelmRelease,
  HelmReleaseGraph,
  HelmReleasePod,
  HelmReleaseResource,
  HelmReleaseService,
  HelmReleaseStatus,
} from '../workload.types';

export const helmReleaseEntityKey = 'helmReleases';
export const helmReleaseStatusEntityType = 'helmReleaseStatus';
export const helmReleasePodEntityType = 'helmReleasePod';
export const helmReleaseServiceEntityType = 'helmReleaseService';
export const helmReleaseGraphEntityType = 'helmReleaseGraph';
export const helmReleaseResourceEntityType = 'helmReleaseResource';

export const getHelmReleaseId = (entity: HelmRelease) => entity.endpointId;
export const getHelmReleaseStatusId = (entity: HelmReleaseStatus) => entity.endpointId;
export const getHelmReleasePodId = (entity: HelmReleasePod) => entity.name;
export const getHelmReleaseServiceId = (entity: HelmReleaseService) => entity.name;
export const getHelmReleaseGraphId = (entity: HelmReleaseGraph) => entity.endpointId;
export const getHelmReleaseReleaseId = (entity: HelmReleaseResource) => entity.endpointId;

const entityCache: {
  [key: string]: EntitySchema
} = {};


entityCache[helmReleaseEntityKey] = new KubernetesEntitySchema(
  helmReleaseEntityKey,
  {},
  { idAttribute: getHelmReleaseId }
);

entityCache[helmReleaseStatusEntityType] = new KubernetesEntitySchema(
  helmReleaseStatusEntityType,
  {},
  { idAttribute: getHelmReleaseStatusId }
);

entityCache[helmReleasePodEntityType] = new KubernetesEntitySchema(
  helmReleasePodEntityType,
  {},
  { idAttribute: getHelmReleasePodId }
);

entityCache[helmReleaseServiceEntityType] = new KubernetesEntitySchema(
  helmReleaseServiceEntityType,
  {},
  { idAttribute: getHelmReleaseServiceId }
);

entityCache[helmReleaseGraphEntityType] = new KubernetesEntitySchema(
  helmReleaseGraphEntityType,
  {},
  { idAttribute: getHelmReleaseGraphId }
);

entityCache[helmReleaseResourceEntityType] = new KubernetesEntitySchema(
  helmReleaseResourceEntityType,
  {},
  { idAttribute: getHelmReleaseReleaseId }
);

Object.entries(entityCache).forEach(([key, workloadSchema]) => addKubernetesEntitySchema(key, workloadSchema));

export const createHelmReleaseEntities = (): { [cacheName: string]: EntitySchema } => {
  return entityCache;
};
