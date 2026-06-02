import {
  StratosCatalogEndpointEntity,
} from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';

/**
 * A strongly typed collection of Helm Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class HelmEntityCatalog {
  endpoint!: StratosCatalogEndpointEntity;
}

/**
 * A strongly typed collection of Helm Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export const helmEntityCatalog: HelmEntityCatalog = new HelmEntityCatalog();
