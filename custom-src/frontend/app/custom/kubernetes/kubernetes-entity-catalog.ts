import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import {
  KubeAppActionBuilders,
  KubeDashboardActionBuilders,
  KubeDeploymentActionBuilders,
  KubeNamespaceActionBuilders,
  KubeNodeActionBuilders,
  KubePodActionBuilders,
  KubeServiceActionBuilders,
  KubeStatefulSetsActionBuilders,
} from './store/action-builders/kube.action-builders';
import {
  KubernetesApp,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './store/kube.types';

/**
 * A strongly typed collection of Kube Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class KubeEntityCatalog {
  public endpoint: StratosCatalogEndpointEntity;
  public app: StratosCatalogEntity<IFavoriteMetadata, KubernetesApp, KubeAppActionBuilders>;
  public statefulSet: StratosCatalogEntity<IFavoriteMetadata, KubernetesStatefulSet, KubeStatefulSetsActionBuilders>;
  public pod: StratosCatalogEntity<IFavoriteMetadata, KubernetesPod, KubePodActionBuilders>;
  public deployment: StratosCatalogEntity<IFavoriteMetadata, KubernetesDeployment, KubeDeploymentActionBuilders>;
  public node: StratosCatalogEntity<IFavoriteMetadata, KubernetesNode, KubeNodeActionBuilders>;
  public namespace: StratosCatalogEntity<IFavoriteMetadata, KubernetesNamespace, KubeNamespaceActionBuilders>;
  public service: StratosCatalogEntity<IFavoriteMetadata, KubeService, KubeServiceActionBuilders>
  public dashboard: StratosCatalogEntity<IFavoriteMetadata, any, KubeDashboardActionBuilders>;
  // TODO: RC workloads stuff
}


export const kubeEntityCatalog: KubeEntityCatalog = new KubeEntityCatalog();
