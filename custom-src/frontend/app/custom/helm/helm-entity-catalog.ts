import { StratosCatalogEndpointEntity, StratosCatalogEntity } from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity'; import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types'; import { MonocularChart, HelmVersion } from './store/helm.types'; import { HelmChartActionBuilders, HelmVersionActionBuilders } from './store/helm.action-builders';

/**
 * A strongly typed collection of Helm Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class HelmEntityCatalog {
  endpoint: StratosCatalogEndpointEntity;
  chart: StratosCatalogEntity<IFavoriteMetadata, MonocularChart, HelmChartActionBuilders>
  version: StratosCatalogEntity<IFavoriteMetadata, HelmVersion, HelmVersionActionBuilders>
}

/**
 * A strongly typed collection of Helm Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export const helmEntityCatalog: HelmEntityCatalog = new HelmEntityCatalog();
