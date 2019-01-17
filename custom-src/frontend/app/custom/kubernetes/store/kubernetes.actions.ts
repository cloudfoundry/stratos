import { SortDirection } from '@angular/material';

import { MetricQueryConfig, MetricsAction, MetricsChartAction } from '../../../store/actions/metrics.actions';
import { getPaginationKey } from '../../../store/actions/pagination.actions';
import {
  kubernetesAppsSchemaKey,
  kubernetesDeploymentsSchemaKey,
  kubernetesNamespacesSchemaKey,
  kubernetesNodesSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesServicesSchemaKey,
  kubernetesStatefulSetsSchemaKey,
} from './kubernetes.entities';
import { PaginatedAction, PaginationParam } from '../../../store/types/pagination.types';
import { IRequestAction } from '../../../store/types/request.types';
import { entityFactory } from '../../../store/helpers/entity-factory';

export const GET_RELEASE_POD_INFO = '[KUBERNETES Endpoint] Get Release Pods Info';
export const GET_RELEASE_POD_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Release Pods Info Success';
export const GET_RELEASE_POD_INFO_FAILURE = '[KUBERNETES Endpoint] Get Release Pods Info Failure';

export const GET_NODES_INFO = '[KUBERNETES Endpoint] Get Nodes Info';
export const GET_NODES_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Nodes Info Success';
export const GET_NODES_INFO_FAILURE = '[KUBERNETES Endpoint] Get Nodes Info Failure';

export const GET_NODE_INFO = '[KUBERNETES Endpoint] Get Node Info';
export const GET_NODE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Node Info Success';
export const GET_NODE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Node Info Failure';

export const GET_POD_INFO = '[KUBERNETES Endpoint] Get Pod Info';
export const GET_POD_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Pod Info Success';
export const GET_POD_INFO_FAILURE = '[KUBERNETES Endpoint] Get Pod Info Failure';

export const GET_PODS_ON_NODE_INFO = '[KUBERNETES Endpoint] Get Pods on Node Info';
export const GET_PODS_ON_NODE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Pods on Node Success';
export const GET_PODS_ON_NODE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Pods on Node Failure';

export const GET_PODS_IN_NAMESPACE_INFO = '[KUBERNETES Endpoint] Get Pods in Namespace Info';
export const GET_PODS_IN_NAMEPSACE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Pods in Namespace Success';
export const GET_PODS_IN_NAMEPSACE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Pods in Namespace Failure';

export const GET_NAMESPACES_INFO = '[KUBERNETES Endpoint] Get Namespaces Info';
export const GET_NAMESPACES_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Namespaces Info Success';
export const GET_NAMESPACES_INFO_FAILURE = '[KUBERNETES Endpoint] Get Namespaces Info Failure';

export const GET_NAMESPACE_INFO = '[KUBERNETES Endpoint] Get Namespace Info';
export const GET_NAMESPACE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Namespace Info Success';
export const GET_NAMESPACE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Namespace Info Failure';

export const GET_KUBERNETES_APP_INFO = '[KUBERNETES Endpoint] Get Kubernetes App Info';
export const GET_KUBERNETES_APP_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Kubernetes App Info Success';
export const GET_KUBERNETES_APP_INFO_FAILURE = '[KUBERNETES Endpoint] Get Kubernetes App Info Failure';

export const GET_SERVICE_INFO = '[KUBERNETES Endpoint] Get Services Info';
export const GET_SERVICE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Services Info Success';
export const GET_SERVICE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Services Info Failure';

export const GET_KUBE_POD = '[KUBERNETES Endpoint] Get K8S Pod Info';
export const GET_KUBE_POD_SUCCESS = '[KUBERNETES Endpoint] Get K8S Pod  Success';
export const GET_KUBE_POD_FAILURE = '[KUBERNETES Endpoint] Get K8S Pod  Failure';

export const GET_KUBE_STATEFULSETS = '[KUBERNETES Endpoint] Get K8S Stateful Sets Info';
export const GET_KUBE_STATEFULSETS_SUCCESS = '[KUBERNETES Endpoint] Get Stateful Sets Success';
export const GET_KUBE_STATEFULSETS_FAILURE = '[KUBERNETES Endpoint] Get Stateful Sets Failure';

export const GET_KUBE_DEPLOYMENT = '[KUBERNETES Endpoint] Get K8S Deployments Info';
export const GET_KUBE_DEPLOYMENT_SUCCESS = '[KUBERNETES Endpoint] Get Deployments Success';
export const GET_KUBE_DEPLOYMENT_FAILURE = '[KUBERNETES Endpoint] Get Deployments Failure';

const sortPodsByName = {
  'order-direction': 'desc' as SortDirection,
  'order-direction-field': 'name'
};

export interface KubeAction extends IRequestAction {
  kubeGuid: string;
}
export interface KubePaginationAction extends PaginatedAction, KubeAction { }

export class GetKubernetesReleasePods implements KubePaginationAction {

  constructor(public kubeGuid: string, releaseName: string) {
    this.paginationKey = getPaginationKey(kubernetesPodsSchemaKey, `release-${releaseName}`, kubeGuid);
    this.initialParams = {
      labelSelector: `app.kubernetes.io/instance=${releaseName}`,
      ...sortPodsByName
    };
  }
  initialParams: PaginationParam;
  type = GET_RELEASE_POD_INFO;
  entityKey = kubernetesPodsSchemaKey;
  entity = [entityFactory(kubernetesPodsSchemaKey)];
  params: { labelSelector: string; };
  actions = [
    GET_RELEASE_POD_INFO,
    GET_RELEASE_POD_INFO_SUCCESS,
    GET_RELEASE_POD_INFO_FAILURE
  ];
  paginationKey: string;
}

export class KubeHealthCheck implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = kubeGuid + '-health-check';
  }
  initialParams = {
    limit: 1
  };
  type = GET_NODES_INFO;
  entityKey = kubernetesNodesSchemaKey;
  entity = [entityFactory(kubernetesNodesSchemaKey)];
  actions = [
    GET_NODES_INFO,
    GET_NODES_INFO_SUCCESS,
    GET_NODES_INFO_FAILURE
  ];
  paginationKey: string;
}

export class GetKubernetesNodes implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesNodesSchemaKey, kubeGuid);
  }
  type = GET_NODES_INFO;
  entityKey = kubernetesNodesSchemaKey;
  entity = [entityFactory(kubernetesNodesSchemaKey)];
  actions = [
    GET_NODES_INFO,
    GET_NODES_INFO_SUCCESS,
    GET_NODES_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc' as SortDirection,
    'order-direction-field': 'name'
  };
}

export class GetKubernetesNode implements KubeAction {
  constructor(public nodeName: string, public kubeGuid: string) {
  }
  type = GET_NODE_INFO;
  entityKey = kubernetesNodesSchemaKey;
  entity = [entityFactory(kubernetesNodesSchemaKey)];

  actions = [
    GET_NODE_INFO,
    GET_NODE_INFO_SUCCESS,
    GET_NODE_INFO_FAILURE
  ];
}

export class GetKubernetesNamespace implements KubeAction {
  constructor(public namespaceName: string, public kubeGuid: string) {
  }
  type = GET_NAMESPACE_INFO;
  entityKey = kubernetesNamespacesSchemaKey;
  entity = [entityFactory(kubernetesNamespacesSchemaKey)];

  actions = [
    GET_NAMESPACE_INFO,
    GET_NAMESPACE_INFO_SUCCESS,
    GET_NAMESPACE_INFO_FAILURE
  ];
}

export class GetKubernetesPods implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesPodsSchemaKey, 'k8', kubeGuid);
  }
  type = GET_POD_INFO;
  entityKey = kubernetesPodsSchemaKey;
  entity = [entityFactory(kubernetesPodsSchemaKey)];
  actions = [
    GET_POD_INFO,
    GET_POD_INFO_SUCCESS,
    GET_POD_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    ...sortPodsByName
  };
}

export class GetKubernetesPodsOnNode implements PaginatedAction, KubeAction {
  constructor(public kubeGuid: string, public nodeName: string) {
    this.paginationKey = getPaginationKey(kubernetesPodsSchemaKey, `node-${nodeName}`, kubeGuid);
    this.initialParams = {
      fieldSelector: `spec.nodeName=${nodeName}`,
      ...sortPodsByName
    };
  }
  type = GET_PODS_ON_NODE_INFO;
  entityKey = kubernetesPodsSchemaKey;
  entity = [entityFactory(kubernetesPodsSchemaKey)];
  actions = [
    GET_PODS_ON_NODE_INFO,
    GET_PODS_ON_NODE_INFO_SUCCESS,
    GET_PODS_ON_NODE_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams: PaginationParam;
}

export class GetKubernetesPodsInNamespace implements PaginatedAction, KubeAction {
  constructor(public kubeGuid: string, public namespaceName: string) {
    this.paginationKey = getPaginationKey(kubernetesPodsSchemaKey, `ns-${namespaceName}`, kubeGuid);
  }
  type = GET_PODS_IN_NAMESPACE_INFO;
  entityKey = kubernetesPodsSchemaKey;
  entity = [entityFactory(kubernetesPodsSchemaKey)];
  actions = [
    GET_PODS_IN_NAMESPACE_INFO,
    GET_PODS_IN_NAMEPSACE_INFO_SUCCESS,
    GET_PODS_IN_NAMEPSACE_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    ...sortPodsByName
  };
}

export class GetKubernetesNamespaces implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesNamespacesSchemaKey, kubeGuid);
  }
  type = GET_NAMESPACES_INFO;
  entityKey = kubernetesNamespacesSchemaKey;
  entity = [entityFactory(kubernetesNamespacesSchemaKey)];
  actions = [
    GET_NAMESPACES_INFO,
    GET_NAMESPACES_INFO_SUCCESS,
    GET_NAMESPACES_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc' as SortDirection,
    'order-direction-field': 'name'
  };
}

export class GetKubernetesApps implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesAppsSchemaKey, kubeGuid);
  }
  type = GET_KUBERNETES_APP_INFO;
  entityKey = kubernetesAppsSchemaKey;
  entity = [entityFactory(kubernetesAppsSchemaKey)];
  actions = [
    GET_KUBERNETES_APP_INFO,
    GET_KUBERNETES_APP_INFO_SUCCESS,
    GET_KUBERNETES_APP_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc' as SortDirection,
    'order-direction-field': 'name'
  };
}

export class GetKubernetesServices implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesServicesSchemaKey, kubeGuid);
  }
  type = GET_SERVICE_INFO;
  entityKey = kubernetesServicesSchemaKey;
  entity = [entityFactory(kubernetesServicesSchemaKey)];
  actions = [
    GET_SERVICE_INFO,
    GET_SERVICE_INFO_SUCCESS,
    GET_SERVICE_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc' as SortDirection,
    'order-direction-field': 'name'
  };
}

export class GetKubernetesPod implements KubeAction {
  constructor(public podName, public namespaceName, public kubeGuid) {
  }
  type = GET_KUBE_POD;
  entityKey = kubernetesPodsSchemaKey;
  entity = [entityFactory(kubernetesPodsSchemaKey)];
  actions = [
    GET_KUBE_POD,
    GET_KUBE_POD_SUCCESS,
    GET_KUBE_POD_FAILURE
  ];
}

export class GetKubernetesStatefulSets implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesStatefulSetsSchemaKey, kubeGuid);
  }
  type = GET_KUBE_STATEFULSETS;
  entityKey = kubernetesStatefulSetsSchemaKey;
  entity = [entityFactory(kubernetesStatefulSetsSchemaKey)];
  actions = [
    GET_KUBE_STATEFULSETS,
    GET_KUBE_STATEFULSETS_SUCCESS,
    GET_KUBE_STATEFULSETS_FAILURE
  ];
  paginationKey: string;
}

export class GeKubernetesDeployments implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesDeploymentsSchemaKey, kubeGuid);
  }
  type = GET_KUBE_DEPLOYMENT;
  entityKey = kubernetesDeploymentsSchemaKey;
  entity = [entityFactory(kubernetesDeploymentsSchemaKey)];
  actions = [
    GET_KUBE_DEPLOYMENT,
    GET_KUBE_DEPLOYMENT_SUCCESS,
    GET_KUBE_DEPLOYMENT_FAILURE
  ];
  paginationKey: string;
}

function getKubeMetricsAction(guid: string) {
  return `${MetricsAction.getBaseMetricsURL()}/kubernetes/${guid}`;
}

export class FetchKubernetesMetricsAction extends MetricsAction {
  constructor(guid: string, cfGuid: string, metricQuery: string) {
    super(guid, cfGuid, new MetricQueryConfig(metricQuery), getKubeMetricsAction(guid));
  }
}

export class FetchKubernetesChartMetricsAction extends MetricsChartAction {
  constructor(guid: string, cfGuid: string, metricQuery: string) {
    super(guid, cfGuid, new MetricQueryConfig(metricQuery), getKubeMetricsAction(guid));
  }
}
