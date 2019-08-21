import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEntity,
} from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { IStratosEndpointDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { APIResource } from '../../../store/src/types/api.types';
import { IFavoriteMetadata } from '../../../store/src/types/user-favorites.types';
import {
  AppAutoscalerHealth,
  AppAutoscalerPolicy,
  AppAutoscalerScalingHistory,
  AppScalingTrigger,
} from './app-autoscaler.types';
import {
  appAutoscalerAppMetricEntityType,
  appAutoscalerHealthEntityType,
  appAutoscalerPolicyEntityType,
  appAutoscalerPolicyTriggerEntityType,
  appAutoscalerScalingHistoryEntityType,
  AUTOSCALER_ENDPOINT_TYPE,
  autoscalerEntityFactory,
} from './autoscaler-entity-factory';

export function generateASEntities(): StratosBaseCatalogueEntity[] {
  // TODO: Q Should autoscaler have an endpoint type? Should it match cf?
  const endpointDefinition: IStratosEndpointDefinition = {
    type: AUTOSCALER_ENDPOINT_TYPE,
    label: 'Cloud Foundry',
    labelPlural: 'Cloud Foundry',
    icon: 'cloud_foundry',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
    authTypes: [],
    schema: undefined
  };
  return [
    generatePolicyEntity(endpointDefinition),
    generatePolicyTriggerEntity(endpointDefinition),
    generateHealthEntity(endpointDefinition),
    generateScalingEntity(endpointDefinition),
    generateMetricEntity(endpointDefinition),
  ];
}

function generatePolicyEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerPolicyEntityType,
    schema: autoscalerEntityFactory(appAutoscalerPolicyEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<AppAutoscalerPolicy>>(definition);
}

function generatePolicyTriggerEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerPolicyTriggerEntityType,
    schema: autoscalerEntityFactory(appAutoscalerPolicyTriggerEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<AppScalingTrigger>>(definition);
}

function generateHealthEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerHealthEntityType,
    schema: autoscalerEntityFactory(appAutoscalerHealthEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<AppAutoscalerHealth>>(definition);
}

function generateScalingEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerScalingHistoryEntityType,
    schema: autoscalerEntityFactory(appAutoscalerScalingHistoryEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<AppAutoscalerScalingHistory>>(definition);
}

function generateMetricEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerAppMetricEntityType,
    schema: autoscalerEntityFactory(appAutoscalerAppMetricEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<any>>(definition); // TODO: RC any
}
