import { environment } from '../../../../../core/src/environments/environment';
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

const debugMissingKubeId = (entity: BasicKubeAPIResource, func: (...args: string[]) => string, ...args: string[]) => {
  if (!environment.production && (!entity.metadata || !entity.metadata.kubeId)) {
    console.warn(`Kube entity does not have a kubeId, this is probably a bug: `, entity);
  }
  return func(...args);
}

export const getGuidFromKubeNode = (kubeGuid: string, name: string): string => deliminate(name, kubeGuid)
export const getGuidFromKubeNodeObj = (entity: KubernetesNode): string =>
  debugMissingKubeId(entity, getGuidFromKubeNode, entity.metadata.kubeId, entity.metadata.name);

export const getGuidFromKubeNamespace = (kubeGuid: string, name: string): string => deliminate(name, kubeGuid)
export const getGuidFromKubeNamespaceObj = (entity: KubernetesNamespace): string =>
  debugMissingKubeId(entity, getGuidFromKubeNamespace, entity.metadata.kubeId, entity.metadata.name);

export const getGuidFromKubeService = (kubeGuid: string, namespace: string, name: string): string => deliminate(name, namespace, kubeGuid);
export const getGuidFromKubeServiceObj = (entity: KubeService): string =>
  debugMissingKubeId(entity, getGuidFromKubeService, entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubeStatefulSet = (kubeGuid: string, namespace: string, name: string): string =>
  deliminate(name, namespace, kubeGuid);
export const getGuidFromKubeStatefulSetObj = (entity: KubernetesStatefulSet): string =>
  debugMissingKubeId(entity, getGuidFromKubeStatefulSet, entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubeDeployment = (kubeGuid: string, namespace: string, name: string): string =>
  deliminate(name, namespace, kubeGuid);
export const getGuidFromKubeDeploymentObj = (entity: KubernetesDeployment): string =>
  debugMissingKubeId(entity, getGuidFromKubeDeployment, entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubePod = (kubeGuid: string, namespace: string, name: string): string => deliminate(name, namespace, kubeGuid);
export const getGuidFromKubePodObj = (entity: KubernetesPod): string =>
  debugMissingKubeId(entity, getGuidFromKubePod, entity.metadata.kubeId, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubeDashboard = (kubeGuid: string): string => kubeGuid
export const getGuidFromKubeDashboardObj = (entity: KubeDashboardStatus): string => getGuidFromKubeDashboard(entity.kubeGuid);
