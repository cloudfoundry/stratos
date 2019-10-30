// import { NgModule } from '@angular/core';

// import { CoreModule } from '../../../core/src/core/core.module';
// import { StratosExtension } from '../../../core/src/core/extension/extension-service';
// import { ExtensionEntitySchema } from '../../../core/src/core/extension/extension-types';
// import { getAPIResourceGuid } from '../../../store/src/selectors/api.selectors';

// export const appAutoscalerHealthSchemaKey = 'autoscalerHealth';
// export const appAutoscalerInfoSchemaKey = 'autoscalerInfo';
// export const appAutoscalerPolicySchemaKey = 'autoscalerPolicy';
// export const appAutoscalerPolicyTriggerSchemaKey = 'autoscalerPolicyTrigger';
// export const appAutoscalerScalingHistorySchemaKey = 'autoscalerScalingHistory';
// export const appAutoscalerAppMetricSchemaKey = 'autoscalerAppMetric';

// export const autoscalerEntities: ExtensionEntitySchema[] = [
//   {
//     entityKey: appAutoscalerInfoSchemaKey,
//     definition: {},
//     options: { idAttribute: getAPIResourceGuid }
//   },
//   {
//     entityKey: appAutoscalerPolicySchemaKey,
//     definition: {},
//     options: { idAttribute: getAPIResourceGuid }
//   },
//   {
//     entityKey: appAutoscalerPolicyTriggerSchemaKey,
//     definition: {},
//     options: { idAttribute: getAPIResourceGuid }
//   },
//   {
//     entityKey: appAutoscalerHealthSchemaKey,
//     definition: {},
//     options: { idAttribute: getAPIResourceGuid }
//   },
//   {
//     entityKey: appAutoscalerScalingHistorySchemaKey,
//     definition: {},
//     options: { idAttribute: getAPIResourceGuid }
//   },
//   {
//     entityKey: appAutoscalerAppMetricSchemaKey,
//     definition: {},
//     options: { idAttribute: getAPIResourceGuid }
//   },
// ];

// @StratosExtension({
//   entities: autoscalerEntities,
// })
// @NgModule({
//   imports: [
//     CoreModule
//   ]
// })
// export class AutoscalerStoreModule { }
