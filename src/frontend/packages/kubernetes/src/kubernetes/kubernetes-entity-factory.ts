import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../../../cloud-foundry/src/store/selectors/api.selectors';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { metricEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import {
  getGuidFromKubeDeploymentObj,
  getGuidFromKubeNamespaceObj,
  getGuidFromKubeNodeObj,
  getGuidFromKubePodObj,
  getGuidFromKubeServiceObj,
  getGuidFromKubeStatefulSetObj,
  getGuidFromResource,
} from './store/kube.getIds';
import { KubernetesApp } from './store/kube.types';

export const kubernetesEntityType = 'info';
export const kubernetesNodesEntityType = 'node';
export const kubernetesPodsEntityType = 'pod';
export const kubernetesNamespacesEntityType = 'namespace';
export const kubernetesServicesEntityType = 'service';
export const kubernetesStatefulSetsEntityType = 'statefulSet';
export const kubernetesDeploymentsEntityType = 'deployment';
export const kubernetesDashboardEntityType = 'dashboard';
export const analysisReportEntityType = 'analysisReport';
export const kubernetesConfigMapEntityType = 'configMap';

export const getKubeAppId = (object: KubernetesApp) => object.name;

export const KUBERNETES_ENDPOINT_TYPE = 'k8s';

const entityCache: {
  [key: string]: EntitySchema;
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


entityCache[kubernetesEntityType] = new KubernetesEntitySchema(
  kubernetesEntityType,
  {},
  { idAttribute: getAPIResourceGuid }
);

entityCache[kubernetesStatefulSetsEntityType] = new KubernetesEntitySchema(
  kubernetesStatefulSetsEntityType,
  {},
  {
    idAttribute: getGuidFromKubeStatefulSetObj
  }
);

entityCache[kubernetesPodsEntityType] = new KubernetesEntitySchema(
  kubernetesPodsEntityType,
  {},
  {
    idAttribute: getGuidFromKubePodObj
  }
);

entityCache[kubernetesDeploymentsEntityType] = new KubernetesEntitySchema(
  kubernetesDeploymentsEntityType,
  {},
  {
    idAttribute: getGuidFromKubeDeploymentObj
  }
);

entityCache[kubernetesNodesEntityType] = new KubernetesEntitySchema(
  kubernetesNodesEntityType,
  {},
  { idAttribute: getGuidFromKubeNodeObj }
);

entityCache[kubernetesNamespacesEntityType] = new KubernetesEntitySchema(
  kubernetesNamespacesEntityType,
  {},
  { idAttribute: getGuidFromKubeNamespaceObj }
);

entityCache[kubernetesServicesEntityType] = new KubernetesEntitySchema(
  kubernetesServicesEntityType,
  {},
  { idAttribute: getGuidFromKubeServiceObj }
);

entityCache[kubernetesDashboardEntityType] = new KubernetesEntitySchema(
  kubernetesDashboardEntityType,
  {},
  { idAttribute: getGuidFromResource }
);

// Analysis Reports - should not be bound to an endpoint
entityCache[analysisReportEntityType] = new KubernetesEntitySchema(
  analysisReportEntityType,
  {},
  { idAttribute: 'id' }
);

entityCache[metricEntityType] = new KubernetesEntitySchema(metricEntityType);

export function addKubernetesEntitySchema(key: string, newSchema: EntitySchema) {
  entityCache[key] = newSchema;
}

export function kubernetesEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
