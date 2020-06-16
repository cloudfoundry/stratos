import {
  OrchestratedActionBuilders,
} from '../../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetHelmReleasePods, GetHelmReleaseServices } from '../../workloads/store/workloads.actions';
import {
  CreateKubernetesNamespace,
  GeKubernetesDeployments,
  GetKubernetesDashboard,
  GetKubernetesNamespace,
  GetKubernetesNamespaces,
  GetKubernetesNode,
  GetKubernetesNodes,
  GetKubernetesPod,
  GetKubernetesPods,
  GetKubernetesPodsInNamespace,
  GetKubernetesPodsOnNode,
  GetKubernetesServices,
  GetKubernetesServicesInNamespace,
  GetKubernetesStatefulSets,
  KubeHealthCheck,
} from '../kubernetes.actions';

export interface KubeStatefulSetsActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesStatefulSets
}

export const kubeStatefulSetsActionBuilders: KubeStatefulSetsActionBuilders = {
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesStatefulSets(kubeGuid)
}

export interface KubePodActionBuilders extends OrchestratedActionBuilders {
  get: (
    podName: string,
    kubeGuid: string,
    extraArgs: { namespace: string }
  ) => GetKubernetesPod,
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesPods
  getOnNode: (
    kubeGuid: string,
    nodeName: string
  ) => GetKubernetesPodsOnNode
  getInNamespace: (
    kubeGuid: string,
    namespace: string
  ) => GetKubernetesPodsInNamespace
  getInWorkload: (
    kubeGuid: string,
    releaseTitle: string
  ) => GetHelmReleasePods
}

export const kubePodActionBuilders: KubePodActionBuilders = {
  get: (podName: string, kubeGuid: string, { namespace }) => new GetKubernetesPod(podName, namespace, kubeGuid),
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesPods(kubeGuid),
  getOnNode: (kubeGuid: string, nodeName: string) => new GetKubernetesPodsOnNode(kubeGuid, nodeName),
  getInNamespace: (kubeGuid: string, namespace: string) => new GetKubernetesPodsInNamespace(kubeGuid, namespace),
  getInWorkload: (kubeGuid: string, releaseTitle: string) => new GetHelmReleasePods(kubeGuid, releaseTitle)
}

export interface KubeDeploymentActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GeKubernetesDeployments
}

export const kubeDeploymentActionBuilders: KubeDeploymentActionBuilders = {
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GeKubernetesDeployments(kubeGuid)
}

export interface KubeNodeActionBuilders extends OrchestratedActionBuilders {
  get: (
    nodeName: string,
    kubeGuid: string
  ) => GetKubernetesNode
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesNodes
  healthCheck: (
    kubeGuid: string,
  ) => KubeHealthCheck;
}

export const kubeNodeActionBuilders: KubeNodeActionBuilders = {
  get: (nodeName: string, endpointGuid: string) => new GetKubernetesNode(nodeName, endpointGuid),
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesNodes(kubeGuid),
  healthCheck: (kubeGuid: string) => new KubeHealthCheck(kubeGuid)
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
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesNamespaces
}

export const kubeNamespaceActionBuilders: KubeNamespaceActionBuilders = {
  get: (namespace: string, kubeGuid: string) => new GetKubernetesNamespace(namespace, kubeGuid),
  create: (namespace: string, kubeGuid: string) => new CreateKubernetesNamespace(namespace, kubeGuid),
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesNamespaces(kubeGuid)
}

export interface KubeServiceActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string
  ) => GetKubernetesServices
  getInNamespace: (
    namespace: string,
    kubeGuid: string
  ) => GetKubernetesServicesInNamespace
  getInWorkload: (
    releaseTitle: string,
    kubeGuid: string
  ) => GetHelmReleaseServices
}

export const kubeServiceActionBuilders: KubeServiceActionBuilders = {
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesServices(kubeGuid),
  getInNamespace: (namespace: string, kubeGuid: string) => new GetKubernetesServicesInNamespace(kubeGuid, namespace),
  getInWorkload: (releaseTitle: string, kubeGuid: string) => new GetHelmReleaseServices(kubeGuid, releaseTitle)
}

export interface KubeDashboardActionBuilders extends OrchestratedActionBuilders {
  get: (
    kubeGuid: string
  ) => GetKubernetesDashboard;
}

export const kubeDashboardActionBuilders: KubeDashboardActionBuilders = {
  get: (kubeGuid: string) => new GetKubernetesDashboard(kubeGuid)
}
