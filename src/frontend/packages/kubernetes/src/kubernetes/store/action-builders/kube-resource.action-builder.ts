import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  DeleteKubernetesResource,
  GetKubernetesResource,
  GetKubernetesResources,
  GetKubernetesResourcesInNamespace,
  GetKubernetesResourcesInWorkload,
} from '../kube-resource.actions';


export interface KubeResourceActionBuilders extends OrchestratedActionBuilders {
  get: (
    resourceName: string,
    kubeGuid: string,
    extraArgs: { namespace: string, }
  ) => GetKubernetesResource;
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesResources;
  getInNamespace: (
    kubeGuid: string,
    namespace: string
  ) => GetKubernetesResourcesInNamespace;
  getInWorkload: (
    kubeGuid: string,
    namespace: string,
    releaseTitle: string
  ) => GetKubernetesResourcesInWorkload;
  deleteResource: (
    kubeGuid: string,
    resourceName: string,
    namespace?: string
  ) => DeleteKubernetesResource;
}

export function createKubeResourceActionBuilder(entityType: string): KubeResourceActionBuilders {
  return {
    get: (resName: string, kubeGuid: string, { namespace }) => new GetKubernetesResource(entityType, resName, namespace, kubeGuid),
    getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesResources(entityType, kubeGuid),
    getInNamespace: (kubeGuid: string, namespace: string) => new GetKubernetesResourcesInNamespace(entityType, kubeGuid, namespace),
    getInWorkload: (kubeGuid: string, namespace: string, releaseTitle: string) =>
      new GetKubernetesResourcesInWorkload(entityType, kubeGuid, namespace, releaseTitle),
    deleteResource: (resName: string, kubeGuid: string, namespace: string) =>
      new DeleteKubernetesResource(entityType, kubeGuid, resName, namespace)
  };
}
