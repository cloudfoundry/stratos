import { KubernetesInfo, KubernetesDefaultState } from './kube.types';

export function kubernetesReducer(state: KubernetesInfo = KubernetesDefaultState, action) {

  console.log(action);
  switch (action.type) {
    default:
      return state;
  }
}
