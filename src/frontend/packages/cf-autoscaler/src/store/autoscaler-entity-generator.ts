import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
  StratosEndpointExtensionDefinition,
  APIResource,
  IFavoriteMetadata
} from '@stratosui/store';
import { AppAutoscalerEvent, AppAutoscalerPolicy, AppScalingTrigger } from './app-autoscaler.types';
import {
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
    // The Autoscale tab's icon: with Cloud Foundry's own icon, and sorted
    // first, the Register tile was picked by mistake for a Cloud Foundry
    // endpoint.
    icon: 'meter',
    iconFont: 'stratos-icons',
    // No image: the tile draws icon/iconFont. logoUrl is a required string,
    // so an empty string stands for none.
    logoUrl: '',
    authTypes: [],
    // Autoscaler calls carry the user's Cloud Foundry token, so nothing
    // connects to this type.
    unConnectable: true,
    // Registered against the Cloud Foundry it serves, and its broker there.
    linkedToCf: true,
    // No listDetailsComponent: omitted rather than null, as Angular TestBed
    // processes null values.
    // After Cloud Foundry (1), before the Kubernetes types (3+).
    renderPriority: 2,
  };
  return [
    generateAutoscalerEndpointEntity(endpointDefinition),
    generatePolicyEntity(endpointDefinition),
    generateInfoEntity(endpointDefinition),
    generatePolicyTriggerEntity(endpointDefinition),
    generateScalingEntity(endpointDefinition),
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

function generateScalingEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: appAutoscalerScalingHistoryEntityType,
    schema: autoscalerEntityFactory(appAutoscalerScalingHistoryEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<AppAutoscalerEvent>>(definition);
}


