import { Schema, schema } from 'normalizr';

import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { stratosMonocularEndpointGuid } from './monocular/stratos-monocular.helper';
import { HelmVersion, MonocularChart } from './store/helm.types';

export const helmVersionsEntityType = 'helmVersions';
export const monocularChartsEntityType = 'monocularCharts';
export const monocularChartVersionsEntityType = 'monocularChartVersions';

export const HELM_ENDPOINT_TYPE = 'helm';
export const HELM_REPO_ENDPOINT_TYPE = 'repo';
export const HELM_HUB_ENDPOINT_TYPE = 'hub';

const entityCache: {
  [key: string]: EntitySchema,
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
  {
    idAttribute: (entity: MonocularChart) => {
      const monocularPrefix = entity.monocularEndpointId || stratosMonocularEndpointGuid;
      return monocularPrefix + '/' + entity.id;
    }
  }
);

entityCache[helmVersionsEntityType] = new HelmEntitySchema(
  helmVersionsEntityType,
  {},
  { idAttribute: (entity: HelmVersion) => entity.endpointId }
);

entityCache[monocularChartVersionsEntityType] = new HelmEntitySchema(
  monocularChartVersionsEntityType,
  {},
  { idAttribute: (entity: MonocularChart) => entity.id }
);

export function helmEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
