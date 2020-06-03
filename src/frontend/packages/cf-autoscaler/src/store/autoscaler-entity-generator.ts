import { IOrgFavMetadata } from '../../../cloud-foundry/src/cf-metadata-types';
import { metricEntityType } from '../../../core/src/base-entity-schemas';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEntity,
} from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEndpointDefinition } from '../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../store/src/types/api.types';
import { IFavoriteMetadata } from '../../../store/src/types/user-favorites.types';
import { AppAutoscalerEvent, AppAutoscalerHealth, AppAutoscalerPolicy, AppScalingTrigger } from './app-autoscaler.types';
import {
  appAutoscalerAppMetricEntityType,
  appAutoscalerCredentialEntityType,
  appAutoscalerHealthEntityType,
  appAutoscalerInfoEntityType,
  appAutoscalerPolicyEntityType,
  appAutoscalerPolicyTriggerEntityType,
  appAutoscalerScalingHistoryEntityType,
  AUTOSCALER_ENDPOINT_TYPE,
  autoscalerEntityFactory,
} from './autoscaler-entity-factory';

export function generateASEntities(): StratosBaseCatalogEntity[] {
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
    generateInfoEntity(endpointDefinition),
    generatePolicyTriggerEntity(endpointDefinition),
    generateHealthEntity(endpointDefinition),
    generateScalingEntity(endpointDefinition),
    generateAppMetricEntity(endpointDefinition),
    generateMetricEntity(endpointDefinition),
    generateCredentialEntity(endpointDefinition),
  ];
}

function generatePolicyEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerPolicyEntityType,
    schema: autoscalerEntityFactory(appAutoscalerPolicyEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerPolicy>>(definition);
}

function generateCredentialEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerCredentialEntityType,
    schema: autoscalerEntityFactory(appAutoscalerCredentialEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerPolicy>>(definition);
}

function generateInfoEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerInfoEntityType,
    schema: autoscalerEntityFactory(appAutoscalerInfoEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppScalingTrigger>>(definition);
}

function generatePolicyTriggerEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerPolicyTriggerEntityType,
    schema: autoscalerEntityFactory(appAutoscalerPolicyTriggerEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppScalingTrigger>>(definition);
}

function generateHealthEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerHealthEntityType,
    schema: autoscalerEntityFactory(appAutoscalerHealthEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerHealth>>(definition);
}

function generateScalingEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerScalingHistoryEntityType,
    schema: autoscalerEntityFactory(appAutoscalerScalingHistoryEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerEvent>>(definition);
}

function generateAppMetricEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appAutoscalerAppMetricEntityType,
    schema: autoscalerEntityFactory(appAutoscalerAppMetricEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<any>>(definition);
}

function generateMetricEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: metricEntityType,
    schema: autoscalerEntityFactory(metricEntityType),
    label: 'Autoscaler Metric',
    labelPlural: 'Autoscaler Metrics',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity<IOrgFavMetadata, APIResource<any>>(definition);
}
