import { NgModule } from '@angular/core';

import { getAPIResourceGuid } from '../../../../store/src/selectors/api.selectors';
import { CoreModule } from '../../core/core.module';
import { StratosExtension } from '../../core/extension/extension-service';
import { ExtensionEntitySchema } from '../../core/extension/extension-types';

export const appAutoscalerHealthSchemaKey = 'autoscalerHealth';
export const appAutoscalerPolicySchemaKey = 'autoscalerPolicy';
export const appAutoscalerPolicyTriggerSchemaKey = 'autoscalerPolicyTrigger';
export const appAutoscalerUpdatedPolicySchemaKey = 'autoscalerUpdatedPolicy';
export const appAutoscalerScalingHistorySchemaKey = 'autoscalerScalingHistory';
export const appAutoscalerAppMetricSchemaKey = 'autoscalerAppMetric';
export const appAutoscalerInsMetricSchemaKey = 'autoscalerInsMetric';

export const autoscalerEntities: ExtensionEntitySchema[] = [
  {
    entityKey: appAutoscalerPolicySchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: appAutoscalerPolicyTriggerSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: appAutoscalerUpdatedPolicySchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: appAutoscalerHealthSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: appAutoscalerScalingHistorySchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: appAutoscalerAppMetricSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: appAutoscalerInsMetricSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  }
];

@StratosExtension({
  entities: autoscalerEntities,
})
@NgModule({
  imports: [
    CoreModule
  ]
})
export class AutoscalerStoreModule { }
