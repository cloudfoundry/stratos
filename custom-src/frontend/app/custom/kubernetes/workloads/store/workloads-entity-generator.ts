import { StratosEndpointExtensionDefinition } from 'frontend/packages/store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from 'frontend/packages/store/src/types/user-favorites.types';

import {
  StratosBaseCatalogEntity,
  StratosCatalogEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { kubernetesEntityFactory } from '../../kubernetes-entity-factory';
import { HelmRelease, HelmReleaseGraph, HelmReleaseResource } from '../workload.types';
import { helmReleaseEntityKey, helmReleaseGraphEntityType, helmReleaseResourceEntityType } from './workloads-entity-factory';


export function generateWorkloadsEntities(endpointDefinition: StratosEndpointExtensionDefinition): StratosBaseCatalogEntity[] {
  return [
    generateReleaseEntity(endpointDefinition),
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

