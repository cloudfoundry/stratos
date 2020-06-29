import { Schema, schema } from 'normalizr';

import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { HelmVersion, MonocularChart } from './store/helm.types';

export const helmVersionsEntityType = 'helmVersions';
export const monocularChartsEntityType = 'monocularCharts';

export const getMonocularChartId = (entity: MonocularChart) => entity.id;
export const getHelmVersionId = (entity: HelmVersion) => entity.endpointId;

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

entityCache[helmVersionsEntityType] = new HelmEntitySchema(
  helmVersionsEntityType,
  {},
  { idAttribute: getHelmVersionId }
);

export function helmEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
