import { getPaginationKey } from '../../../store/actions/pagination.actions';
import { PaginatedAction } from '../../../store/types/pagination.types';
import { kubernetesNodesSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';

export const GET_NODE_INFO = '[KUBERNETES Endpoint] Get Nodes Info';
export const GET_NODE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Nodes Info Success';
export const GET_NODE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Nodes Info Failure';

/**
 * Action to request the information for a given Kubernetes cluster
 */
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
