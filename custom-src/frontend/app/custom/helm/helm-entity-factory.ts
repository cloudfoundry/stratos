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

// TODO: SchemaKey names (and kube names)
export const monocularChartsSchemaKey = 'monocularCharts';

export const helmReleaseSchemaKey = 'helmReleases';
export const helmVersionsSchemaKey = 'helmVersions';
export const helmReleaseStatusSchemaKey = 'helmReleaseStatus';
export const helmReleasePodKey = 'helmReleasePod';
export const helmReleaseServiceKey = 'helmReleaseService';

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

entityCache[monocularChartsSchemaKey] = new HelmEntitySchema(
  monocularChartsSchemaKey,
  {},
  { idAttribute: getMonocularChartId }
);

entityCache[helmReleaseSchemaKey] = new HelmEntitySchema(
  helmReleaseSchemaKey,
  {},
  { idAttribute: getHelmReleaseId }
);

entityCache[helmVersionsSchemaKey] = new HelmEntitySchema(
  helmVersionsSchemaKey,
  {},
  { idAttribute: getHelmVersionId }
);

entityCache[helmReleaseStatusSchemaKey] = new HelmEntitySchema(
  helmReleaseStatusSchemaKey,
  {},
  { idAttribute: getHelmReleaseStatusId }
);

entityCache[helmReleasePodKey] = new HelmEntitySchema(
  helmReleasePodKey,
  {},
  { idAttribute: getHelmReleasePodId }
);

entityCache[helmReleaseServiceKey] = new HelmEntitySchema(
  helmReleaseServiceKey,
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
