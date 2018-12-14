import { getKubeAPIResourceGuid } from './kube.selectors';
import { getAPIResourceGuid } from '../../../store/selectors/api.selectors';
import { ExtensionEntitySchema } from '../../../core/extension/extension-types';

export const kubernetesSchemaKey = 'kubernetesInfo';
export const kubernetesNodesSchemaKey = 'kubernetesNode';
export const kubernetesPodsSchemaKey = 'kubernetesPod';
export const kubernetesNamespacesSchemaKey = 'kubernetesNamespace';
export const kubernetesServicesSchemaKey = 'kubernetesService';
export const kubernetesStatefulSetsSchemaKey = 'kubernetesStatefulSet';
export const kubernetesDeploymentsSchemaKey = 'kubernetesDeployment';
export const kubernetesAppsSchemaKey = 'kubernetesApp';

export const kubernetesEntities: ExtensionEntitySchema[] = [
  {
    entityKey: kubernetesSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesAppsSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesStatefulSetsSchemaKey,
    definition: {},
    options: { idAttribute: getKubeAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesPodsSchemaKey,
    definition: {},
    options: { idAttribute: getKubeAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesDeploymentsSchemaKey,
    definition: {},
    options: { idAttribute: getKubeAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesNodesSchemaKey,
    definition: {},
    options: { idAttribute: getKubeAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesNamespacesSchemaKey,
    definition: {},
    options: { idAttribute: getKubeAPIResourceGuid },
    group: 'k8s'
  },
  {
    entityKey: kubernetesServicesSchemaKey,
    definition: {},
    options: { idAttribute: getKubeAPIResourceGuid },
    group: 'k8s'
  }
];
