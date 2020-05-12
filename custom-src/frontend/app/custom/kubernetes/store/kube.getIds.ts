import {
  BasicKubeAPIResource,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './kube.types';
import { KubeDashboardStatus } from './kubernetes.effects';

const deliminate = (...args: string[]) => args.join('_:_');

const debugMissingKubeId = (entity: BasicKubeAPIResource) => {
  if (!entity.metadata) {
    console.log('DANGER WILL ROBINSON1:', entity);
  } else if (!entity.metadata.kubeId) {
    console.log('DANGER WILL ROBINSON2:', entity);
  }
}

export const getGuidFromKubeNode = (kubeGuid: string, name: string): string => {
  return deliminate(name, kubeGuid);
}
export const getGuidFromKubeNodeObj = (entity: KubernetesNode): string => {
  debugMissingKubeId(entity);
  return getGuidFromKubeNode(entity.metadata.kubeId, entity.metadata.name);
}

export const getGuidFromKubeNamespace = (kubeGuid: string, name: string): string => {
  return deliminate(name, kubeGuid);
}
export const getGuidFromKubeNamespaceObj = (entity: KubernetesNamespace): string => {
  debugMissingKubeId(entity);
  return getGuidFromKubeNamespace(entity.metadata.kubeId, entity.metadata.name);
}

export const getGuidFromKubeService = (kubeGuid: string, namespace: string, name: string): string => {
  return deliminate(name, namespace, kubeGuid);
}
export const getGuidFromKubeServiceObj = (entity: KubeService): string => {
  debugMissingKubeId(entity);
  return getGuidFromKubeService(entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);
}

export const getGuidFromKubeStatefulSet = (kubeGuid: string, namespace: string, name: string): string => {
  return deliminate(name, namespace, kubeGuid);
}
export const getGuidFromKubeStatefulSetObj = (entity: KubernetesStatefulSet): string => {
  debugMissingKubeId(entity);
  return getGuidFromKubeStatefulSet(entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);
}


export const getGuidFromKubeDeployment = (kubeGuid: string, namespace: string, name: string): string => {
  return deliminate(name, namespace, kubeGuid);
}
export const getGuidFromKubeDeploymentObj = (entity: KubernetesDeployment): string => {
  debugMissingKubeId(entity);
  return getGuidFromKubeDeployment(entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);
}

export const getGuidFromKubePod = (kubeGuid: string, namespace: string, name: string): string => {
  return deliminate(name, namespace, kubeGuid);
}
export const getGuidFromKubePodObj = (entity: KubernetesPod): string => {
  debugMissingKubeId(entity);
  return getGuidFromKubePod(entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);
}

export const getGuidFromKubeDashboard = (kubeGuid: string): string => {
  return kubeGuid;
}
export const getGuidFromKubeDashboardObj = (entity: KubeDashboardStatus): string => {
  if (!!entity.kubeGuid) {
    console.log('aaaaa!!!!!');
  }
  return getGuidFromKubeDashboard(entity.kubeGuid);
}