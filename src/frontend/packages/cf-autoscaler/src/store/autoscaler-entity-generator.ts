import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
  StratosEndpointExtensionDefinition,
  APIResource,
  IFavoriteMetadata
} from '@stratosui/store';
import { AppAutoscalerEvent, AppAutoscalerHealth, AppAutoscalerPolicy, AppScalingTrigger } from './app-autoscaler.types';
import {
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
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: AUTOSCALER_ENDPOINT_TYPE,
    label: 'Cloud Foundry Autoscaler',
    labelPlural: 'Cloud Foundry Autoscalers',
    icon: 'cloud_foundry',
    iconFont: 'stratos-icons',
    // No logoUrl for virtual endpoints - they don't appear in endpoint listings
    // and don't need image-based branding. logoUrl is a required string on the
    // endpoint definition, so use an empty string sentinel; rendering is driven
    // by icon/iconFont instead.
    logoUrl: '',
    authTypes: [],
    // Autoscaler is a virtual endpoint type - it doesn't appear in the endpoints list
    // as it's a feature running on CF endpoints, not a separate connectable endpoint
    unConnectable: true,
    // No listDetailsComponent needed for virtual endpoints - omit the property entirely
    // rather than setting it to null, as Angular TestBed will try to process null values
    renderPriority: 0,
  };
  return [
    generateAutoscalerEndpointEntity(endpointDefinition),
    generatePolicyEntity(endpointDefinition),
    generateInfoEntity(endpointDefinition),
    generatePolicyTriggerEntity(endpointDefinition),
    generateHealthEntity(endpointDefinition),
    generateScalingEntity(endpointDefinition),
    generateCredentialEntity(endpointDefinition),
  ];
}

function generateAutoscalerEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const endpointEntity = new StratosCatalogEndpointEntity(endpointDefinition);
  return endpointEntity;
}

function generatePolicyEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerPolicyEntityType,
    schema: autoscalerEntityFactory(appAutoscalerPolicyEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerPolicy>>(definition);
}

function generateCredentialEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerCredentialEntityType,
    schema: autoscalerEntityFactory(appAutoscalerCredentialEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerPolicy>>(definition);
}

function generateInfoEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerInfoEntityType,
    schema: autoscalerEntityFactory(appAutoscalerInfoEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppScalingTrigger>>(definition);
}

function generatePolicyTriggerEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerPolicyTriggerEntityType,
    schema: autoscalerEntityFactory(appAutoscalerPolicyTriggerEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppScalingTrigger>>(definition);
}

function generateHealthEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerHealthEntityType,
    schema: autoscalerEntityFactory(appAutoscalerHealthEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerHealth>>(definition);
}

function generateScalingEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerScalingHistoryEntityType,
    schema: autoscalerEntityFactory(appAutoscalerScalingHistoryEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerEvent>>(definition);
}


