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
  helmReleasePodKey,
  helmReleaseSchemaKey,
  helmReleaseServiceKey,
  helmReleaseStatusSchemaKey,
  helmVersionsSchemaKey,
  monocularChartsSchemaKey,
} from './helm-entity-factory';
import {
  HelmRelease,
  HelmReleasePod,
  HelmReleaseService,
  HelmReleaseStatus,
  HelmVersion,
  MonocularChart,
} from './store/helm.types';

// TODO: RC hack
/**
 * CustomImportModule brings in CustomModule. CustomModule brings in kube setup module. setup module brings this in multiple times
 */
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
    type: monocularChartsSchemaKey,
    schema: helmEntityFactory(monocularChartsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, MonocularChart>(definition);
}

function generateReleaseEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseSchemaKey,
    schema: helmEntityFactory(helmReleaseSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmRelease>(definition);
}

function generateVersionEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmVersionsSchemaKey,
    schema: helmEntityFactory(helmVersionsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmVersion>(definition);
}

function generateReleaseStatusEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseStatusSchemaKey,
    schema: helmEntityFactory(helmReleaseStatusSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmReleaseStatus>(definition);
}

function generateReleasePodEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleasePodKey,
    schema: helmEntityFactory(helmReleasePodKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmReleasePod>(definition);
}

function generateReleaseServiceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseServiceKey,
    schema: helmEntityFactory(helmReleaseServiceKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, HelmReleaseService>(definition);
}

