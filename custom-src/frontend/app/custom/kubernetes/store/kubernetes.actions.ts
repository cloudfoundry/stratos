import { getPaginationKey } from '../../../store/actions/pagination.actions';
import { entityFactory } from '../../../store/helpers/entity-factory';
import { PaginatedAction } from '../../../store/types/pagination.types';

import { schema } from 'normalizr';

export const KUBE_INFO_ENTITY_KEY = 'kubernetesInfo';

export const GET_INFO = '[KUBERNETES Endpoint] Get Info';
export const GET_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Info Success';
export const GET_INFO_FAILURE = '[KUBERNETES Endpoint] Get Info Failure';

export const KubernetesInfoSchema = new schema.Entity(KUBE_INFO_ENTITY_KEY);

/**
 * Action to request the information for a given Kubernetes cluster
 */
export class GetKubernetesInfo implements PaginatedAction {
  constructor(public kubeGuid) {
    console.log('>>>' + kubeGuid);
    this.paginationKey = getPaginationKey(KubernetesInfoSchema.key, kubeGuid);
  }
  type = GET_INFO;
  entityKey = KubernetesInfoSchema.key;
  entity = [entityFactory(KubernetesInfoSchema.key)];
  actions = [
    GET_INFO,
    GET_INFO_SUCCESS,
    GET_INFO_FAILURE
  ];
  paginationKey: string;
}
