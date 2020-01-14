import {
  StratosBaseCatalogEntity,
  StratosCatalogEntity,
} from 'frontend/packages/store/src/entity-catalog/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from 'frontend/packages/store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from 'frontend/packages/store/src/types/user-favorites.types';

import { kubernetesEntityFactory } from '../../kubernetes-entity-factory';
import { HelmRelease, HelmReleaseGraph, HelmReleasePod, HelmReleaseResource, HelmReleaseService } from '../workload.types';
import {
  helmReleaseEntityKey,
  helmReleaseGraphEntityType,
  helmReleasePodEntityType,
  helmReleaseResourceEntityType,
  helmReleaseServiceEntityType,
} from './workloads-entity-factory';


export function generateWorkloadsEntities(endpointDefinition: StratosEndpointExtensionDefinition): StratosBaseCatalogEntity[] {
  return [
    generateReleaseEntity(endpointDefinition),
    // generateReleaseStatusEntity(endpointDefinition),
    generateReleasePodEntity(endpointDefinition),
    generateReleaseServiceEntity(endpointDefinition),
    generateReleaseGraphEntity(endpointDefinition),
    generateReleaseResourceEntity(endpointDefinition),
  ];
}


function generateReleaseEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseEntityKey,
    schema: kubernetesEntityFactory(helmReleaseEntityKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, HelmRelease>(definition);
}

// function generateReleaseStatusEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
//   const definition = {
//     type: helmReleaseStatusEntityType,
//     schema: kubernetesEntityFactory(helmReleaseStatusEntityType),
//     endpoint: endpointDefinition
//   };
//   return new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseStatus>(definition);
// }

function generateReleasePodEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleasePodEntityType,
    schema: kubernetesEntityFactory(helmReleasePodEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, HelmReleasePod>(definition);
}

function generateReleaseServiceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseServiceEntityType,
    schema: kubernetesEntityFactory(helmReleaseServiceEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseService>(definition);
}

function generateReleaseGraphEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseGraphEntityType,
    schema: kubernetesEntityFactory(helmReleaseGraphEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseGraph>(definition);
}

function generateReleaseResourceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseResourceEntityType,
    schema: kubernetesEntityFactory(helmReleaseResourceEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseResource>(definition);
}

