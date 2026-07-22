/*
 * Public API Surface of cloud-foundry
 */

export * from './cf-autoscaler-package.module';
export * from './cf-autoscaler-routing.module';
export * from './core/autoscaler-helpers/autoscaler-available';

// Signal-native data services (wave-3 A-effects-cleanup): the
// autoscaler I/O surface, available to cross-package consumers without
// going through ngrx Store/Effects.
export { AutoscalerInfoDataService } from './services/domain-data/autoscaler-info-data.service';
export { AutoscalerPolicyDataService } from './services/domain-data/autoscaler-policy-data.service';
export { AutoscalerMetricDataService } from './services/domain-data/autoscaler-metric-data.service';
export { AutoscalerScalingHistoryDataService } from './services/domain-data/autoscaler-scaling-history-data.service';

// Autoscaler Entity Generator
export { generateASEntities } from './store/autoscaler-entity-generator';
