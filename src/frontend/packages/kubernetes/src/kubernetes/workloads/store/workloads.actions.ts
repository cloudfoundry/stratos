import { EntityRequestAction } from 'frontend/packages/store/src/types/request.types';

import { MonocularPaginationAction } from '../../../helm/store/helm.actions';
import { HelmUpgradeValues } from '../../../helm/store/helm.types';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesEntityFactory,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
} from '../../kubernetes-entity-factory';
import { KubePaginationAction } from '../../store/kubernetes.actions';
import {
  getHelmReleaseGraphId,
  getHelmReleaseId,
  getHelmReleaseResourceId,
  helmReleaseEntityKey,
  helmReleaseGraphEntityType,
  helmReleaseHistoryEntityType,
  helmReleaseResourceEntityType,
} from './workloads-entity-factory';

export const GET_HELM_RELEASES = '[Helm] Get Releases';
export const GET_HELM_RELEASES_SUCCESS = '[Helm] Get Releases Success';
export const GET_HELM_RELEASES_FAILURE = '[Helm] Get Releases Failure';

export const GET_HELM_RELEASE = '[Helm] Get Release Status';
export const GET_HELM_RELEASE_SUCCESS = '[Helm] Get Release Status Success';
export const GET_HELM_RELEASE_FAILURE = '[Helm] Get Release Status Failure';

export const GET_HELM_RELEASE_PODS = '[Helm] Get Release Pods';
export const GET_HELM_RELEASE_PODS_SUCCESS = '[Helm] Get Release Pods Success';
export const GET_HELM_RELEASE_PODS_FAILURE = '[Helm] Get Release Pods Failure';

export const GET_HELM_RELEASE_SERVICES = '[Helm] Get Release Services';
export const GET_HELM_RELEASE_SERVICES_SUCCESS = '[Helm] Get Release Services Success';
export const GET_HELM_RELEASE_SERVICES_FAILURE = '[Helm] Get Release Services Failure';

export const UPDATE_HELM_RELEASE = '[Helm] Update Release';
export const UPDATE_HELM_RELEASE_SUCCESS = '[Helm] Update Release Success';
export const UPDATE_HELM_RELEASE_FAILURE = '[Helm] Update Release Failure';

export const GET_HELM_RELEASE_HISTORY = '[Helm] Get Release History';
export const GET_HELM_RELEASE_HISTORY_SUCCESS = '[Helm] Get Release History Success';
export const GET_HELM_RELEASE_HISTORY_FAILURE = '[Helm] Get Release History Failure';

export const UPGRADE_HELM_RELEASE = '[Helm] Upgrade Release';
export const UPGRADE_HELM_RELEASE_SUCCESS = '[Helm] Upgrade Release Success';
export const UPGRADE_HELM_RELEASE_FAILURE = '[Helm] Upgrade Release Failure';

interface HelmReleaseSingleEntity extends EntityRequestAction {
  guid: string;
}

export class GetHelmReleases implements MonocularPaginationAction {
  constructor() {
    this.paginationKey = 'helm-releases';
  }
  type = GET_HELM_RELEASES;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entityType = helmReleaseEntityKey;
  entity = [kubernetesEntityFactory(helmReleaseEntityKey)];
  actions = [
    GET_HELM_RELEASES,
    GET_HELM_RELEASES_SUCCESS,
    GET_HELM_RELEASES_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}

export class GetHelmRelease implements HelmReleaseSingleEntity {
  guid: string;
  constructor(
    public endpointGuid: string,
    public namespace: string,
    public releaseTitle: string
  ) {
    this.guid = getHelmReleaseId(endpointGuid, namespace, releaseTitle);
  }
  type = GET_HELM_RELEASE;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseEntityKey);
  entityType = helmReleaseEntityKey;
  actions = [
    GET_HELM_RELEASE,
    GET_HELM_RELEASE_SUCCESS,
    GET_HELM_RELEASE_FAILURE
  ];
}

export class GetHelmReleaseGraph implements HelmReleaseSingleEntity {
  guid: string;
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.guid = getHelmReleaseGraphId(endpointGuid, releaseTitle);
  }
  type = this.constructor.name;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseGraphEntityType);
  entityType = helmReleaseGraphEntityType;
  actions = [this.type];
}

export class GetHelmReleaseResource implements HelmReleaseSingleEntity {
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.guid = getHelmReleaseResourceId(this.endpointGuid, this.releaseTitle);
  }
  type = this.constructor.name;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseResourceEntityType);
  entityType = helmReleaseResourceEntityType;
  actions = [this.type];
  guid: string;
}

/**
 * Won't fetch pods, used to push/retrieve data from store
 */
export class GetHelmReleasePods implements KubePaginationAction {
  constructor(
    public kubeGuid: string,
    public releaseTitle: string
  ) {
    this.paginationKey = `${kubeGuid}/${releaseTitle}/pods`;
  }
  type = GET_HELM_RELEASE_PODS;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entityType = kubernetesPodsEntityType;
  entity = [kubernetesEntityFactory(kubernetesPodsEntityType)];
  actions = [
    GET_HELM_RELEASE_PODS,
    GET_HELM_RELEASE_PODS_SUCCESS,
    GET_HELM_RELEASE_PODS_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}


/**
 * Won't fetch services, used to push/retrieve data from store
 */
export class GetHelmReleaseServices implements KubePaginationAction {
  constructor(
    public kubeGuid: string,
    public releaseTitle: string
  ) {
    this.paginationKey = `${kubeGuid}/${releaseTitle}/services`;
  }
  type = GET_HELM_RELEASE_SERVICES;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entityType = kubernetesServicesEntityType;
  entity = [kubernetesEntityFactory(kubernetesServicesEntityType)];
  actions = [
    GET_HELM_RELEASE_SERVICES,
    GET_HELM_RELEASE_SERVICES_SUCCESS,
    GET_HELM_RELEASE_SERVICES_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}

export class GetHelmReleaseHistory implements HelmReleaseSingleEntity {
  constructor(
    public endpointGuid: string,
    public namespace: string,
    public releaseTitle: string
  ) {
    this.guid = getHelmReleaseId(this.endpointGuid, this.namespace, this.releaseTitle);
  }
  type = GET_HELM_RELEASE_HISTORY;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseHistoryEntityType);
  entityType = helmReleaseHistoryEntityType;
  actions = [
    GET_HELM_RELEASE_HISTORY,
    GET_HELM_RELEASE_HISTORY_SUCCESS,
    GET_HELM_RELEASE_HISTORY_FAILURE
  ];

  guid: string;
}

export class UpgradeHelmRelease implements HelmReleaseSingleEntity {
  guid: string;
  type = UPGRADE_HELM_RELEASE;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseEntityKey);
  entityType = helmReleaseEntityKey;
  constructor(
    public releaseTitle: string,
    public endpointGuid: string,
    public namespace: string,
    public values: HelmUpgradeValues
  ) {
    this.guid = getHelmReleaseId(this.endpointGuid, this.namespace, this.releaseTitle);
  }
  updatingKey = 'upgrading';
  actions = [
    UPGRADE_HELM_RELEASE,
    UPGRADE_HELM_RELEASE_SUCCESS,
    UPGRADE_HELM_RELEASE_FAILURE
  ];
}
