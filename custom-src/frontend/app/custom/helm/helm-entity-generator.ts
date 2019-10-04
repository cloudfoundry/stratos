import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity,
} from '../../core/entity-catalogue/entity-catalogue-entity';
import { StratosEndpointExtensionDefinition } from '../../core/entity-catalogue/entity-catalogue.types';
import {
  HELM_ENDPOINT_TYPE,
  helmEntityFactory,
  helmReleaseEntityKey,
  helmReleasePodEntityType,
  helmReleaseServiceEntityType,
  helmReleaseStatusEntityType,
  helmVersionsEntityType,
  monocularChartsEntityType,
} from './helm-entity-factory';
import {
  HelmRelease,
  HelmReleasePod,
  HelmReleaseService,
  HelmReleaseStatus,
  HelmVersion,
  MonocularChart,
} from './store/helm.types';

// TODO: RC Multi load issue
let hack = false;

export function generateHelmEntities(): StratosBaseCatalogueEntity[] {
  if (hack) {
    return [];
  }
  hack = true;

  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: HELM_ENDPOINT_TYPE,
    label: 'Helm Repository',
    labelPlural: 'Helm Repositories',
    icon: 'helm',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/custom/helm.svg',
    urlValidation: undefined,
    unConnectable: true,
    techPreview: true,
    authTypes: [],
    renderPriority: 5,
  };
  return [
    generateEndpointEntity(endpointDefinition),
    generateChartEntity(endpointDefinition),
    generateReleaseEntity(endpointDefinition),
    generateVersionEntity(endpointDefinition),
    generateReleaseStatusEntity(endpointDefinition),
    generateReleasePodEntity(endpointDefinition),
    generateReleaseServiceEntity(endpointDefinition),
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  return new StratosCatalogueEndpointEntity(
    endpointDefinition,
    metadata => `/monocular/repos/${metadata.guid}`,
  );
}

function generateChartEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: monocularChartsEntityType,
    schema: helmEntityFactory(monocularChartsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, MonocularChart>(definition);
}

function generateReleaseEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseEntityKey,
    schema: helmEntityFactory(helmReleaseEntityKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmRelease>(definition);
}

function generateVersionEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmVersionsEntityType,
    schema: helmEntityFactory(helmVersionsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmVersion>(definition);
}

function generateReleaseStatusEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseStatusEntityType,
    schema: helmEntityFactory(helmReleaseStatusEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmReleaseStatus>(definition);
}

function generateReleasePodEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleasePodEntityType,
    schema: helmEntityFactory(helmReleasePodEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmReleasePod>(definition);
}

function generateReleaseServiceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseServiceEntityType,
    schema: helmEntityFactory(helmReleaseServiceEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmReleaseService>(definition);
}

