import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import {
  HELM_ENDPOINT_TYPE,
  helmEntityFactory,
  helmVersionsEntityType,
  monocularChartsEntityType,
} from './helm-entity-factory';
import { HelmVersion, MonocularChart } from './store/helm.types';


export function generateHelmEntities(): StratosBaseCatalogEntity[] {
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: HELM_ENDPOINT_TYPE,
    label: 'Helm Repository',
    labelPlural: 'Helm Repositories',
    icon: 'helm',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/custom/helm.svg',
    urlValidation: undefined,
    unConnectable: true,
    techPreview: false,
    authTypes: [],
    renderPriority: 10,
  };
  return [
    generateEndpointEntity(endpointDefinition),
    generateChartEntity(endpointDefinition),
    generateVersionEntity(endpointDefinition),
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  return new StratosCatalogEndpointEntity(
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
  return new StratosCatalogEntity<IFavoriteMetadata, MonocularChart>(definition);
}

function generateVersionEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmVersionsEntityType,
    schema: helmEntityFactory(helmVersionsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, HelmVersion>(definition);
}


