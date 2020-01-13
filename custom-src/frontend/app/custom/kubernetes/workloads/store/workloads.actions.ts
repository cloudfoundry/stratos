import { Action } from '@ngrx/store';
import { EntityRequestAction } from 'frontend/packages/store/src/types/request.types';

import { MonocularPaginationAction } from '../../../helm/store/helm.actions';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesEntityFactory,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
} from '../../kubernetes-entity-factory';
import { helmReleaseEntityKey, helmReleaseGraphEntityType, helmReleaseStatusEntityType } from './workloads-entity-factory';

export const GET_HELM_RELEASES = '[Helm] Get Releases';
export const GET_HELM_RELEASES_SUCCESS = '[Helm] Get Releases Success';
export const GET_HELM_RELEASES_FAILURE = '[Helm] Get Releases Failure';

export const GET_HELM_RELEASE_STATUS = '[Helm] Get Release Status';
export const GET_HELM_RELEASE_STATUS_SUCCESS = '[Helm] Get Release Status Success';
export const GET_HELM_RELEASE_STATUS_FAILURE = '[Helm] Get Release Status Failure';

export const GET_HELM_RELEASE_PODS = '[Helm] Get Release Pods';
export const GET_HELM_RELEASE_PODS_SUCCESS = '[Helm] Get Release Pods Success';
export const GET_HELM_RELEASE_PODS_FAILURE = '[Helm] Get Release Pods Failure';

export const GET_HELM_RELEASE_SERVICES = '[Helm] Get Release Services';
export const GET_HELM_RELEASE_SERVICES_SUCCESS = '[Helm] Get Release Services Success';
export const GET_HELM_RELEASE_SERVICES_FAILURE = '[Helm] Get Release Services Failure';

export const UPDATE_HELM_RELEASE_STATUS = '[Helm] Update Release Status [WS]';
export const UPDATE_HELM_RELEASE_STATUS_SUCCESS = '[Helm] Update Release Status [WS] Success';
export const UPDATE_HELM_RELEASE_STATUS_FAILURE = '[Helm] Update Release Status [WS] Failure';

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

export class GetHelmReleaseStatus implements EntityRequestAction {
  key: string;
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    // TODO: This should have `namespace` in if used in future?
    this.key = `${endpointGuid}/${releaseTitle}`;
  }
  type = GET_HELM_RELEASE_STATUS;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseStatusEntityType);
  entityType = helmReleaseStatusEntityType;
  actions = [
    GET_HELM_RELEASE_STATUS,
    GET_HELM_RELEASE_STATUS_SUCCESS,
    GET_HELM_RELEASE_STATUS_FAILURE
  ];
}

// Never dispateched - just used for look-up
// Don't know why I need an action for this rather than an entity type?
export class GetHelmReleaseGraph implements EntityRequestAction {
  key: string;
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.key = `${endpointGuid}-${releaseTitle}`;
  }
  type = this.constructor.name;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(helmReleaseGraphEntityType);
  entityType = helmReleaseGraphEntityType;
  actions = [this.type];
}

// Never dispateched - just used for look-up
// Don't know why I need an action for this rather than an entity type?
export class GetHelmReleaseResource implements EntityRequestAction {
  key: string;
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.key = `${endpointGuid}-${releaseTitle}`;
  }
  type = this.constructor.name;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entity = kubernetesEntityFactory(kubernetesPodsEntityType);
  entityType = kubernetesPodsEntityType;
  actions = [this.type];
}


export class GetHelmReleasePods implements MonocularPaginationAction {
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.paginationKey = `${endpointGuid}/${releaseTitle}/pods`;
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
    'order-direction': 'asc',
    'order-direction-field': 'name',
  };
  static createKey = (endpointGuid: string, releaseTitle: string, name: string): string => {
    return `${endpointGuid}/${releaseTitle}/${name}`;
  }
}

export class GetHelmReleaseServices implements MonocularPaginationAction {
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.paginationKey = `${endpointGuid}/${releaseTitle}/services`;
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
    'order-direction': 'asc',
    'order-direction-field': 'name',
  };
  static createKey = (endpointGuid: string, releaseTitle: string, name: string): string => {
    return `${endpointGuid}/${releaseTitle}/${name}`;
  }
}

export class HelmUpdateRelease implements Action {
  constructor(public values: any) { }
  type = UPDATE_HELM_RELEASE_STATUS;
  // public guid = () => '<New Release>' + this.values.releaseName;
}
