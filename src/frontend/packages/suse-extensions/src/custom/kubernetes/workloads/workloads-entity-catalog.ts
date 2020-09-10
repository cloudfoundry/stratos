import { StratosCatalogEntity } from '../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IFavoriteMetadata } from '../../../../../store/src/types/user-favorites.types';
import {
  WorkloadGraphBuilders,
  WorkloadReleaseBuilders,
  WorkloadResourceBuilders,
  WorkloadResourceHistoryBuilders,
} from './store/workload-action-builders';
import { HelmRelease, HelmReleaseGraph, HelmReleaseHistory, HelmReleaseResources } from './workload.types';

/**
 * A strongly typed collection of Workload Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class WorkloadsEntityCatalog {
  release: StratosCatalogEntity<IFavoriteMetadata, HelmRelease, WorkloadReleaseBuilders>;
  graph: StratosCatalogEntity<IFavoriteMetadata, HelmReleaseGraph, WorkloadGraphBuilders>;
  resource: StratosCatalogEntity<IFavoriteMetadata, HelmReleaseResources, WorkloadResourceBuilders>;
  history: StratosCatalogEntity<IFavoriteMetadata, HelmReleaseHistory, WorkloadResourceHistoryBuilders>;
}

/**
 * A strongly typed collection of Workload Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export const workloadsEntityCatalog: WorkloadsEntityCatalog = new WorkloadsEntityCatalog();
