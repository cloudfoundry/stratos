import {
  StratosBaseCatalogEntity,
  StratosCatalogEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from '../../../../../../store/src/types/user-favorites.types';
import { kubernetesEntityFactory } from '../../kubernetes-entity-factory';
import { HelmRelease, HelmReleaseGraph, HelmReleaseResource } from '../workload.types';
import { workloadsEntityCatalog } from '../workloads-entity-catalog';
import {
  WorkloadGraphBuilders,
  workloadGraphBuilders,
  WorkloadReleaseBuilders,
  workloadReleaseBuilders,
  WorkloadResourceBuilders,
  workloadResourceBuilders,
} from './workload-action-builders';
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
  workloadsEntityCatalog.release = new StratosCatalogEntity<IFavoriteMetadata, HelmRelease, WorkloadReleaseBuilders>(
    definition,
    {
      actionBuilders: workloadReleaseBuilders
    }
  );
  return workloadsEntityCatalog.release;
}

function generateReleaseGraphEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseGraphEntityType,
    schema: kubernetesEntityFactory(helmReleaseGraphEntityType),
    endpoint: endpointDefinition
  };
  workloadsEntityCatalog.graph = new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseGraph, WorkloadGraphBuilders>(
    definition,
    {
      actionBuilders: workloadGraphBuilders
    }
  );
  return workloadsEntityCatalog.graph;
}

function generateReleaseResourceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseResourceEntityType,
    schema: kubernetesEntityFactory(helmReleaseResourceEntityType),
    endpoint: endpointDefinition
  };
  workloadsEntityCatalog.resource = new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseResource, WorkloadResourceBuilders>(
    definition,
    {
      actionBuilders: workloadResourceBuilders
    }
  );
  return workloadsEntityCatalog.resource;
}

