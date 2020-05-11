import {
  OrchestratedActionBuilders,
} from '../../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  CreateKubernetesNamespace,
  GetKubernetesNamespace,
  GetKubernetesNode,
  GetKubernetesNodes,
} from '../kubernetes.actions';

export interface KubeAppActionBuilders extends OrchestratedActionBuilders {

}

export const kubeAppActionBuilders: KubeAppActionBuilders = {
}

export interface KubeStatefulSetsActionBuilders extends OrchestratedActionBuilders {

}

export const kubeStatefulSetsActionBuilders: KubeStatefulSetsActionBuilders = {
}

export interface KubePodActionBuilders extends OrchestratedActionBuilders {

}

export const kubePodActionBuilders: KubePodActionBuilders = {
}

export interface KubeDeploymentActionBuilders extends OrchestratedActionBuilders {

}

export const kubeDeploymentActionBuilders: KubeDeploymentActionBuilders = {
}

export interface KubeNodeActionBuilders extends OrchestratedActionBuilders {
  get: (
    nodeName: string,
    kubeGuid: string
  ) => GetKubernetesNode
  getMultiple: (
    kubeGuid: string,
    paginationKey: string,
  ) => GetKubernetesNodes
}

export const kubeNodeActionBuilders: KubeNodeActionBuilders = {
  get: (nodeName: string, endpointGuid: string) => new GetKubernetesNode(nodeName, endpointGuid),
  getMultiple: (kubeGuid: string, paginationKey: string) => new GetKubernetesNodes(kubeGuid)
}

export interface KubeNamespaceActionBuilders extends OrchestratedActionBuilders {
  get: (
    namespace: string,
    kubeGuid: string
  ) => GetKubernetesNamespace;
  create: (
    namespace: string,
    kubeGuid: string
  ) => CreateKubernetesNamespace;
}

export const kubeNamespaceActionBuilders: KubeNamespaceActionBuilders = {
  get: (namespace: string, kubeGuid: string) => new GetKubernetesNamespace(namespace, kubeGuid),
  create: (namespace: string, kubeGuid: string) => new CreateKubernetesNamespace(namespace, kubeGuid)
}

export interface KubeServiceActionBuilders extends OrchestratedActionBuilders {

}

export const kubeServiceActionBuilders: KubeServiceActionBuilders = {
}

export interface KubeDashboardActionBuilders extends OrchestratedActionBuilders {

}

export const kubeDashboardActionBuilders: KubeDashboardActionBuilders = {
}

// export interface A extends OrchestratedActionBuilders {

// }

// export const a: A = {
// }