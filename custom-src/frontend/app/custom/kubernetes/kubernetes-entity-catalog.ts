import { StratosCatalogEntity } from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import { KubeNamespaceActionBuilders } from './store/action-builders/kube.action-builders';
import { KubernetesNamespace } from './store/kube.types';

/**
 * A strongly typed collection of Kube Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class KubeEntityCatalog {

  public namespace: StratosCatalogEntity<IFavoriteMetadata, KubernetesNamespace, KubeNamespaceActionBuilders>;

}



export const kubeEntityCatalog: KubeEntityCatalog = new KubeEntityCatalog();
