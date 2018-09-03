import { getPaginationKey } from '../../../store/actions/pagination.actions';
import { PaginatedAction } from '../../../store/types/pagination.types';
import { kubernetesNodesSchemaKey, entityFactory, kubernetesPodsSchemaKey } from '../../../store/helpers/entity-factory';
import { kubernetesNamespacesSchemaKey } from '../../../../../../src/frontend/app/store/helpers/entity-factory';

export const GET_NODE_INFO = '[KUBERNETES Endpoint] Get Nodes Info';
export const GET_NODE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Nodes Info Success';
export const GET_NODE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Nodes Info Failure';

export const GET_POD_INFO = '[KUBERNETES Endpoint] Get Pod Info';
export const GET_POD_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Pod Info Success';
export const GET_POD_INFO_FAILURE = '[KUBERNETES Endpoint] Get Pod Info Failure';

export const GET_NAMESPACES_INFO = '[KUBERNETES Endpoint] Get Namespaces Info';
export const GET_NAMESPACES_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Namespaces Info Success';
export const GET_NAMESPACES_INFO_FAILURE = '[KUBERNETES Endpoint] Get Namespaces Info Failure';

export class GetKubernetesNodes implements PaginatedAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesNodesSchemaKey, kubeGuid);
  }
  type = GET_NODE_INFO;
  entityKey = kubernetesNodesSchemaKey;
  entity = [entityFactory(kubernetesNodesSchemaKey)];
  actions = [
    GET_NODE_INFO,
    GET_NODE_INFO_SUCCESS,
    GET_NODE_INFO_FAILURE
  ];
  paginationKey: string;
}

export class GetKubernetesPods implements PaginatedAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesPodsSchemaKey, kubeGuid);
  }
  type = GET_POD_INFO;
  entityKey = kubernetesPodsSchemaKey;
  entity = [entityFactory(kubernetesPodsSchemaKey)];
  actions = [
    GET_POD_INFO,
    GET_POD_INFO_SUCCESS,
    GET_POD_INFO_FAILURE
  ];
  paginationKey: string;
}
export class GetKubernetesNamespaces implements PaginatedAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesNamespacesSchemaKey, kubeGuid);
  }
  type = GET_NAMESPACES_INFO;
  entityKey = kubernetesNamespacesSchemaKey;
  entity = [entityFactory(kubernetesNamespacesSchemaKey)];
  actions = [
    GET_NAMESPACES_INFO,
    GET_NAMESPACES_INFO_SUCCESS,
    GET_NAMESPACES_INFO_FAILURE
  ];
  paginationKey: string;
}
