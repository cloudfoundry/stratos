import { cfEntityFactory } from '../../../cloud-foundry/src/cf-entity-factory';
import { metricEntityType } from '../../../cloud-foundry/src/cf-entity-schema-types';
import { IOrgFavMetadata } from '../../../cloud-foundry/src/cf-metadata-types';
import { IOrganization } from '../../../core/src/core/cf-api.types';
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
  const endpointDefinition = {
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
    generateAppMetricEntity(endpointDefinition),
    generateMetricEntity(endpointDefinition)
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

function generateAppMetricEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerAppMetricEntityType,
    schema: autoscalerEntityFactory(appAutoscalerAppMetricEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<any>>(definition);
}

function generateMetricEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: metricEntityType,
    schema: cfEntityFactory(metricEntityType),
    label: 'Autoscaler Metric',
    labelPlural: 'Autoscaler Metrics',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogueEntity<IOrgFavMetadata, APIResource<IOrganization>>(definition);
}
