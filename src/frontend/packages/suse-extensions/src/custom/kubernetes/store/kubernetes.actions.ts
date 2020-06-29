import { SortDirection } from '@angular/material/sort';
import { getActions } from 'frontend/packages/store/src/actions/action.helper';
import { ApiRequestTypes } from 'frontend/packages/store/src/reducers/api-request-reducer/request-helpers';

import { MetricQueryConfig, MetricsAction, MetricsChartAction } from '../../../../../store/src/actions/metrics.actions';
import { getPaginationKey } from '../../../../../store/src/actions/pagination.actions';
import { PaginatedAction, PaginationParam } from '../../../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../../../store/src/types/request.types';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesDashboardEntityType,
  kubernetesDeploymentsEntityType,
  kubernetesEntityFactory,
  kubernetesNamespacesEntityType,
  kubernetesNodesEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
  kubernetesStatefulSetsEntityType,
} from '../kubernetes-entity-factory';
import { getGuidFromKubeDashboard, getGuidFromKubeNamespace, getGuidFromKubeNode, getGuidFromKubePod } from './kube.getIds';

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

export const GET_SERVICES_IN_NAMESPACE_INFO = '[KUBERNETES Endpoint] Get Services in Namespace Info';
export const GET_SERVICES_IN_NAMESPACE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Services in Namespace Success';
export const GET_SERVICES_IN_NAMESPACE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Services in Namespace Failure';

export const GET_NAMESPACES_INFO = '[KUBERNETES Endpoint] Get Namespaces Info';
export const GET_NAMESPACES_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Namespaces Info Success';
export const GET_NAMESPACES_INFO_FAILURE = '[KUBERNETES Endpoint] Get Namespaces Info Failure';

export const GET_NAMESPACE_INFO = '[KUBERNETES Endpoint] Get Namespace Info';
export const GET_NAMESPACE_INFO_SUCCESS = '[KUBERNETES Endpoint] Get Namespace Info Success';
export const GET_NAMESPACE_INFO_FAILURE = '[KUBERNETES Endpoint] Get Namespace Info Failure';

export const CREATE_NAMESPACE = '[KUBERNETES Endpoint] Create Namespace';

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

export const GET_KUBE_DASHBOARD = '[KUBERNETES Endpoint] Get K8S Dashboard Info';
export const GET_KUBE_DASHBOARD_SUCCESS = '[KUBERNETES Endpoint] Get Dashboard Success';
export const GET_KUBE_DASHBOARD_FAILURE = '[KUBERNETES Endpoint] Get Dashboard Failure';


const defaultSortParams = {
  'order-direction': 'desc' as SortDirection,
  'order-direction-field': 'name'
};


export interface KubeAction extends EntityRequestAction {
  kubeGuid: string;
}
export interface KubePaginationAction extends PaginatedAction, KubeAction {
  flattenPagination: boolean;
}
export interface KubeSingleEntityAction extends KubeAction {
  guid: string;
}

export class GetKubernetesNode implements KubeSingleEntityAction {
  constructor(public nodeName: string, public kubeGuid: string) {
    this.guid = getGuidFromKubeNode(kubeGuid, nodeName);
  }
  type = GET_NODE_INFO;
  entityType = kubernetesNodesEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesNodesEntityType)];
  actions = [
    GET_NODE_INFO,
    GET_NODE_INFO_SUCCESS,
    GET_NODE_INFO_FAILURE
  ];
  guid: string;
}

export class GetKubernetesNodes implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesNodesEntityType, kubeGuid);
  }
  type = GET_NODES_INFO;
  entityType = kubernetesNodesEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesNodesEntityType)];
  actions = [
    GET_NODES_INFO,
    GET_NODES_INFO_SUCCESS,
    GET_NODES_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams: PaginationParam = {
    ...defaultSortParams
  };
  flattenPagination = true;
}

export class KubeHealthCheck extends GetKubernetesNodes {
  constructor(kubeGuid) {
    super(kubeGuid);
    this.paginationKey = kubeGuid + '-health-check';
    this.initialParams.limit = 1;
  }
}

export class CreateKubernetesNamespace implements KubeSingleEntityAction {

  constructor(public namespaceName: string, public kubeGuid: string) {
    this.guid = getGuidFromKubeNamespace(kubeGuid, namespaceName);
  }

  type = CREATE_NAMESPACE;
  entityType = kubernetesNamespacesEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesNamespacesEntityType)];
  actions = getActions('Namespace', 'Create');
  requestType: ApiRequestTypes = 'create';
  guid: string;
}

export class GetKubernetesNamespace implements KubeSingleEntityAction {
  constructor(public namespaceName: string, public kubeGuid: string) {
    this.guid = getGuidFromKubeNamespace(kubeGuid, namespaceName);
  }
  type = GET_NAMESPACE_INFO;
  entityType = kubernetesNamespacesEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesNamespacesEntityType)];
  actions = [
    GET_NAMESPACE_INFO,
    GET_NAMESPACE_INFO_SUCCESS,
    GET_NAMESPACE_INFO_FAILURE
  ];
  guid: string;
}

export class GetKubernetesNamespaces implements KubePaginationAction {
  constructor(public kubeGuid: string) {
    this.paginationKey = getPaginationKey(kubernetesNamespacesEntityType, kubeGuid || 'all');
  }
  type = GET_NAMESPACES_INFO;
  entityType = kubernetesNamespacesEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesNamespacesEntityType)];
  actions = [
    GET_NAMESPACES_INFO,
    GET_NAMESPACES_INFO_SUCCESS,
    GET_NAMESPACES_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    ...defaultSortParams
  };
  flattenPagination = true;
}

export class GetKubernetesPod implements KubeSingleEntityAction {
  constructor(public podName, public namespaceName, public kubeGuid) {
    this.guid = getGuidFromKubePod(kubeGuid, namespaceName, podName);
  }
  type = GET_KUBE_POD;
  entityType = kubernetesPodsEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesPodsEntityType)];
  actions = [
    GET_KUBE_POD,
    GET_KUBE_POD_SUCCESS,
    GET_KUBE_POD_FAILURE
  ];
  guid: string;
}

export class GetKubernetesPods implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesPodsEntityType, 'k8', kubeGuid);
  }
  type = GET_POD_INFO;
  entityType = kubernetesPodsEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesPodsEntityType)];
  actions = [
    GET_POD_INFO,
    GET_POD_INFO_SUCCESS,
    GET_POD_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams: PaginationParam = {
    ...defaultSortParams
  };
  flattenPagination = true;
}

export class GetKubernetesPodsOnNode extends GetKubernetesPods {
  constructor(kubeGuid: string, public nodeName: string) {
    super(kubeGuid)
    this.paginationKey = getPaginationKey(kubernetesPodsEntityType, `node-${nodeName}`, kubeGuid);
    this.initialParams.fieldSelector = `spec.nodeName=${nodeName}`;
  }
  type = GET_PODS_ON_NODE_INFO;
  actions = [
    GET_PODS_ON_NODE_INFO,
    GET_PODS_ON_NODE_INFO_SUCCESS,
    GET_PODS_ON_NODE_INFO_FAILURE
  ];
}

export class GetKubernetesPodsInNamespace extends GetKubernetesPods {
  constructor(kubeGuid: string, public namespaceName: string) {
    super(kubeGuid);
    this.paginationKey = getPaginationKey(kubernetesPodsEntityType, `ns-${namespaceName}`, kubeGuid);
  }
  type = GET_PODS_IN_NAMESPACE_INFO;
  actions = [
    GET_PODS_IN_NAMESPACE_INFO,
    GET_PODS_IN_NAMEPSACE_INFO_SUCCESS,
    GET_PODS_IN_NAMEPSACE_INFO_FAILURE
  ];
}

export class GetKubernetesServices implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesServicesEntityType, kubeGuid);
  }
  type = GET_SERVICE_INFO;
  entityType = kubernetesServicesEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesServicesEntityType)];
  actions = [
    GET_SERVICE_INFO,
    GET_SERVICE_INFO_SUCCESS,
    GET_SERVICE_INFO_FAILURE
  ];
  paginationKey: string;
  initialParams: PaginationParam = {
    ...defaultSortParams
  };
  flattenPagination = true;
}

export class GetKubernetesServicesInNamespace extends GetKubernetesServices {
  constructor(kubeGuid: string, public namespaceName: string) {
    super(kubeGuid);
    this.paginationKey = getPaginationKey(kubernetesPodsEntityType, namespaceName, kubeGuid);
  }
  type = GET_SERVICES_IN_NAMESPACE_INFO;
  actions = [
    GET_SERVICES_IN_NAMESPACE_INFO,
    GET_SERVICES_IN_NAMESPACE_INFO_SUCCESS,
    GET_SERVICES_IN_NAMESPACE_INFO_FAILURE
  ];
}


export class GetKubernetesStatefulSets implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesStatefulSetsEntityType, kubeGuid);
  }
  type = GET_KUBE_STATEFULSETS;
  entityType = kubernetesStatefulSetsEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesStatefulSetsEntityType)];
  actions = [
    GET_KUBE_STATEFULSETS,
    GET_KUBE_STATEFULSETS_SUCCESS,
    GET_KUBE_STATEFULSETS_FAILURE
  ];
  paginationKey: string;
  flattenPagination = true;
}

export class GeKubernetesDeployments implements KubePaginationAction {
  constructor(public kubeGuid) {
    this.paginationKey = getPaginationKey(kubernetesDeploymentsEntityType, kubeGuid);
  }
  type = GET_KUBE_DEPLOYMENT;
  entityType = kubernetesDeploymentsEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesDeploymentsEntityType)];
  actions = [
    GET_KUBE_DEPLOYMENT,
    GET_KUBE_DEPLOYMENT_SUCCESS,
    GET_KUBE_DEPLOYMENT_FAILURE
  ];
  paginationKey: string;
  flattenPagination = true;
}

export class GetKubernetesDashboard implements KubeSingleEntityAction {
  constructor(public kubeGuid: string) {
    this.guid = getGuidFromKubeDashboard(kubeGuid);
  }
  type = GET_KUBE_DASHBOARD;
  entityType = kubernetesDashboardEntityType;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = [kubernetesEntityFactory(kubernetesDashboardEntityType)];

  actions = [
    GET_KUBE_DASHBOARD,
    GET_KUBE_DASHBOARD_SUCCESS,
    GET_KUBE_DASHBOARD_FAILURE
  ];
  guid: string;
}

function getKubeMetricsAction(guid: string) {
  return `${MetricsAction.getBaseMetricsURL()}/kubernetes/${guid}`;
}

export class FetchKubernetesMetricsAction extends MetricsAction {
  constructor(guid: string, cfGuid: string, metricQuery: string) {
    super(
      guid,
      cfGuid,
      new MetricQueryConfig(metricQuery),
      getKubeMetricsAction(guid),
      undefined,
      undefined,
      undefined,
      KUBERNETES_ENDPOINT_TYPE
    );
  }
}

export class FetchKubernetesChartMetricsAction extends MetricsChartAction {
  constructor(guid: string, cfGuid: string, metricQuery: string) {
    super(
      guid,
      cfGuid,
      new MetricQueryConfig(metricQuery),
      getKubeMetricsAction(guid),
      KUBERNETES_ENDPOINT_TYPE
    );
  }
}


