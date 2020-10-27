import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../../../cloud-foundry/src/store/selectors/api.selectors';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { metricEntityType } from '../../../store/src/helpers/stratos-entity-factory';

export const appAutoscalerInfoEntityType = 'autoscalerInfo';
export const appAutoscalerHealthEntityType = 'autoscalerHealth';
export const appAutoscalerPolicyEntityType = 'autoscalerPolicy';
export const appAutoscalerPolicyTriggerEntityType = 'autoscalerPolicyTrigger';
export const appAutoscalerScalingHistoryEntityType = 'autoscalerScalingHistory';
export const appAutoscalerAppMetricEntityType = 'autoscalerAppMetric';
export const appAutoscalerCredentialEntityType = 'autoscalerCredential';

export const AUTOSCALER_ENDPOINT_TYPE = 'autoscaler';

const entityCache: {
  [key: string]: EntitySchema
} = {};

export class AutoscalerEntitySchema extends EntitySchema {
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
    super(entityKey, AUTOSCALER_ENDPOINT_TYPE, definition, options, relationKey);
  }
}

entityCache[appAutoscalerInfoEntityType] = new AutoscalerEntitySchema(
  appAutoscalerInfoEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);

entityCache[appAutoscalerCredentialEntityType] = new AutoscalerEntitySchema(
  appAutoscalerCredentialEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);

entityCache[appAutoscalerPolicyEntityType] = new AutoscalerEntitySchema(
  appAutoscalerPolicyEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);

entityCache[appAutoscalerPolicyTriggerEntityType] = new AutoscalerEntitySchema(
  appAutoscalerPolicyTriggerEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);
entityCache[appAutoscalerHealthEntityType] = new AutoscalerEntitySchema(
  appAutoscalerHealthEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);
entityCache[appAutoscalerScalingHistoryEntityType] = new AutoscalerEntitySchema(
  appAutoscalerScalingHistoryEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);
entityCache[appAutoscalerAppMetricEntityType] = new AutoscalerEntitySchema(
  appAutoscalerAppMetricEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);

const MetricSchema = new AutoscalerEntitySchema(metricEntityType);
entityCache[metricEntityType] = MetricSchema;

export function autoscalerEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
