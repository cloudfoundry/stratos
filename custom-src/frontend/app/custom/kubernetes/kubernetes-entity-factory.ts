import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../../../../cloud-foundry/src/store/selectors/api.selectors';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { getKubeAPIResourceGuid } from './store/kube.selectors';
import { KubernetesApp } from './store/kube.types';

export const kubernetesSchemaKey = 'kubernetesInfo';
export const kubernetesNodesSchemaKey = 'kubernetesNode';
export const kubernetesPodsSchemaKey = 'kubernetesPod';
export const kubernetesNamespacesSchemaKey = 'kubernetesNamespace';
export const kubernetesServicesSchemaKey = 'kubernetesService';
export const kubernetesStatefulSetsSchemaKey = 'kubernetesStatefulSet';
export const kubernetesDeploymentsSchemaKey = 'kubernetesDeployment';
export const kubernetesAppsSchemaKey = 'kubernetesApp';
export const kubernetesDashboardSchemaKey = 'kubernetesDashboard';

export const getKubeAppId = (object: KubernetesApp) => object.name;

export const KUBERNETES_ENDPOINT_TYPE = 'k8s';

const entityCache: {
  [key: string]: EntitySchema
} = {};

export class KubernetesEntitySchema extends EntitySchema {
  /**
   * @param entityKey As per schema.Entity ctor
   * @param [definition] As per schema.Entity ctor
   * @param [options] As per schema.Entity ctor
   * @param [relationKey] Allows multiple children of the same type within a single parent entity. For instance user with developer
   * spaces, manager spaces, auditor space, etc
   */
  constructor(
    entityKey: string,
    definition?: Schema,
    options?: schema.EntityOptions,
    relationKey?: string
  ) {
    super(entityKey, KUBERNETES_ENDPOINT_TYPE, definition, options, relationKey);
  }
}


entityCache[kubernetesSchemaKey] = new KubernetesEntitySchema(
  kubernetesSchemaKey,
  {},
  { idAttribute: getAPIResourceGuid }
);

entityCache[kubernetesAppsSchemaKey] = new KubernetesEntitySchema(
  kubernetesAppsSchemaKey,
  {},
  { idAttribute: getKubeAppId }
);

entityCache[kubernetesStatefulSetsSchemaKey] = new KubernetesEntitySchema(
  kubernetesStatefulSetsSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);

entityCache[kubernetesPodsSchemaKey] = new KubernetesEntitySchema(
  kubernetesPodsSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);

entityCache[kubernetesDeploymentsSchemaKey] = new KubernetesEntitySchema(
  kubernetesDeploymentsSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);

entityCache[kubernetesNodesSchemaKey] = new KubernetesEntitySchema(
  kubernetesNodesSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);

entityCache[kubernetesNamespacesSchemaKey] = new KubernetesEntitySchema(
  kubernetesNamespacesSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);

entityCache[kubernetesServicesSchemaKey] = new KubernetesEntitySchema(
  kubernetesServicesSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);

entityCache[kubernetesDashboardSchemaKey] = new KubernetesEntitySchema(
  kubernetesDashboardSchemaKey,
  {},
  { idAttribute: getKubeAPIResourceGuid }
);


export function kubernetesEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
