import { SETUP_UAA, SETUP_UAA_FAILED, SETUP_UAA_SCOPE, SETUP_UAA_SUCCESS } from './../actions/setup.actions';
import { Action } from '@ngrx/store';
import { KubernetesInfo, KubernetesDefaultState } from './kube.types';
import { GET_INFO } from '../../../../../../custom-src/frontend/app/custom/kubernetes/store/kubernetes.actions';



export function kubernetesReducer(state: KubernetesInfo = KubernetesDefaultState, action) {
  switch (action.type) {
    default:
      return state;
  }
}
