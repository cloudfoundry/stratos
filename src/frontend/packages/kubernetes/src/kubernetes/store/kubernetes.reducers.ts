import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store'; import { KubernetesCurrentNamespace } from './kube.types';
import { SET_CURRENT_NAMESPACE } from './kubernetes.actions';

export const KUBERNETES_CURRENT_NAMESPACE = 'k8sCurrentNamespace';

const defaultState: KubernetesCurrentNamespace = {};

function createCurrentNamespaceReducer(state: KubernetesCurrentNamespace = defaultState, action) {
  switch (action.type) {
    case SET_CURRENT_NAMESPACE:
      return {
        ...state,
        [action.endpoint]: action.namespace
      };
    default:
      return state;
  }
}

@NgModule({
  imports: [
    StoreModule.forFeature(KUBERNETES_CURRENT_NAMESPACE, createCurrentNamespaceReducer),
  ]
})
export class KubernetesReducersModule { }
