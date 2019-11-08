import { Schema, schema } from 'normalizr';

import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import {
  HelmRelease,
  HelmReleasePod,
  HelmReleaseService,
  HelmReleaseStatus,
  HelmVersion,
  MonocularChart,
} from './store/helm.types';

export const monocularChartsEntityType = 'monocularCharts';

export const helmReleaseEntityKey = 'helmReleases';
export const helmVersionsEntityType = 'helmVersions';
export const helmReleaseStatusEntityType = 'helmReleaseStatus';
export const helmReleasePodEntityType = 'helmReleasePod';
export const helmReleaseServiceEntityType = 'helmReleaseService';

export const getMonocularChartId = (entity: MonocularChart) => entity.id;
export const getHelmReleaseId = (entity: HelmRelease) => entity.endpointId;
export const getHelmVersionId = (entity: HelmVersion) => entity.endpointId;
export const getHelmReleaseStatusId = (entity: HelmReleaseStatus) => entity.endpointId;
export const getHelmReleasePodId = (entity: HelmReleasePod) => entity.name;
export const getHelmReleaseServiceId = (entity: HelmReleaseService) => entity.name;

export const HELM_ENDPOINT_TYPE = 'helm';

const entityCache: {
  [key: string]: EntitySchema
} = {};

export class HelmEntitySchema extends EntitySchema {
  /**
   * @param entityKey As per schema.Entity ctor
   * @param [definition] As per schema.Entity ctor
   * @param [options] As per schema.Entity ctor
   * @param [relationKey] Allows multiple children of the same type within a single parent entity. For instance user with developer
   * spaces, manager spaces, auditor space, etc
   */
  constructor(
    entityKey: string,
    definition?: Schema,
    options?: schema.EntityOptions,
    relationKey?: string
  ) {
    super(entityKey, HELM_ENDPOINT_TYPE, definition, options, relationKey);
  }
}

entityCache[monocularChartsEntityType] = new HelmEntitySchema(
  monocularChartsEntityType,
  {},
  { idAttribute: getMonocularChartId }
);

entityCache[helmReleaseEntityKey] = new HelmEntitySchema(
  helmReleaseEntityKey,
  {},
  { idAttribute: getHelmReleaseId }
);

entityCache[helmVersionsEntityType] = new HelmEntitySchema(
  helmVersionsEntityType,
  {},
  { idAttribute: getHelmVersionId }
);

entityCache[helmReleaseStatusEntityType] = new HelmEntitySchema(
  helmReleaseStatusEntityType,
  {},
  { idAttribute: getHelmReleaseStatusId }
);

entityCache[helmReleasePodEntityType] = new HelmEntitySchema(
  helmReleasePodEntityType,
  {},
  { idAttribute: getHelmReleasePodId }
);

entityCache[helmReleaseServiceEntityType] = new HelmEntitySchema(
  helmReleaseServiceEntityType,
  {},
  { idAttribute: getHelmReleaseServiceId }
);

export function helmEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
