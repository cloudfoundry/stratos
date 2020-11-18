import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetKubernetesResource, GetKubernetesResources, GetKubernetesResourcesInNamespace } from '../kube-resource.actions';


export interface KubeResourceActionBuilders extends OrchestratedActionBuilders {
  get: (
    resourceName: string,
    kubeGuid: string,
    extraArgs: { namespace: string }
  ) => GetKubernetesResource;
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesResources;
  getInNamespace: (
    kubeGuid: string,
    namespace: string
  ) => GetKubernetesResourcesInNamespace;
}

export function createKubeResourceActionBuilder(entityType: string): KubeResourceActionBuilders {
  return {
    get: (resName: string, kubeGuid: string, { namespace }) => new GetKubernetesResource(entityType, resName, namespace, kubeGuid),
    getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesResources(entityType, kubeGuid),
    getInNamespace: (kubeGuid: string, namespace: string) => new GetKubernetesResourcesInNamespace(entityType, kubeGuid, namespace),
  };
}
