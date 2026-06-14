import { environment } from '../../../../core/src/environments/environment';
import {
  BasicKubeAPIResource,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './kube.types';

const deliminate = (...args: string[]) => args.join('_:_');

const debugMissingKubeId = (entity: BasicKubeAPIResource, func: (...args: string[]) => string, ...args: string[]) => {
  if (!environment.production && (!entity.metadata || !entity.metadata.kubeId)) {
    console.warn(`Kube entity does not have a kubeId, this is probably a bug: `, entity);
  }
  return func(...args);
};

export const getGuidFromKubeNode = (kubeGuid: string, name: string): string => deliminate(name, kubeGuid);

export const getGuidForResource = (kubeGuid: string, name: string): string => deliminate(name, kubeGuid);
export const getGuidForNamespacedResource = (kubeGuid: string, namespace: string, name: string): string =>
  deliminate(name, namespace, kubeGuid);

/**
 * Get the ID for a Kubernetes Resource
 */
export const getGuidFromResource = (entity: BasicKubeAPIResource): string => {

  // Resource with namespace
  if (entity.metadata.namespace) {
    // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
    return deliminate(entity.metadata.kubeId!, entity.metadata.namespace, entity.metadata.name);
  }

  // Named resource (no namespace)
  if (entity.metadata.name) {
    // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
    return deliminate(entity.metadata.kubeId!, entity.metadata.name);
  }

  // Cluster-level resource (e.g. Kubernetes dashboard)
  // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
  return entity.metadata.kubeId!;
};

// ======================================================================================================================================
// LEGACY - Remove those not needed
// ======================================================================================================================================

export const getGuidFromKubeNodeObj = (entity: KubernetesNode): string => getGuidFromResource(entity);

export const getGuidFromKubeNamespace = (kubeGuid: string, name: string): string => deliminate(name, kubeGuid);
export const getGuidFromKubeNamespaceObj = (entity: KubernetesNamespace): string =>
  // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
  debugMissingKubeId(entity, getGuidFromKubeNamespace, entity.metadata.kubeId!, entity.metadata.name);

export const getGuidFromKubeService = (kubeGuid: string, namespace: string, name: string): string => deliminate(name, namespace, kubeGuid);
export const getGuidFromKubeServiceObj = (entity: KubeService): string =>
  // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
  debugMissingKubeId(entity, getGuidFromKubeService, entity.metadata.kubeId!, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubeStatefulSet = (kubeGuid: string, namespace: string, name: string): string =>
  deliminate(name, namespace, kubeGuid);
export const getGuidFromKubeStatefulSetObj = (entity: KubernetesStatefulSet): string =>
  // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
  debugMissingKubeId(entity, getGuidFromKubeStatefulSet, entity.metadata.kubeId!, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubeDeployment = (kubeGuid: string, namespace: string, name: string): string =>
  deliminate(name, namespace, kubeGuid);
export const getGuidFromKubeDeploymentObj = (entity: KubernetesDeployment): string =>
  // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
  debugMissingKubeId(entity, getGuidFromKubeDeployment, entity.metadata.kubeId!, entity.metadata.namespace, entity.metadata.name);

export const getGuidFromKubePod = (kubeGuid: string, namespace: string, name: string): string => deliminate(name, namespace, kubeGuid);
export const getGuidFromKubePodObj = (entity: KubernetesPod): string =>
  // strict: kubeId is populated by Stratos before id generation; absence is a bug flagged via debugMissingKubeId
  debugMissingKubeId(entity, getGuidFromKubePod, entity.metadata.kubeId!, entity.metadata.namespace, entity.metadata.name);
