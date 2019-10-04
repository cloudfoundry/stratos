import { Action } from '@ngrx/store';

import { EntityRequestAction } from '../../../../../store/src/types/request.types';
import {
  HELM_ENDPOINT_TYPE,
  helmEntityFactory,
  helmReleasePodKey,
  helmReleaseSchemaKey,
  helmReleaseServiceKey,
  helmReleaseStatusSchemaKey,
  helmVersionsSchemaKey,
  monocularChartsSchemaKey,
} from '../helm-entity-factory';
import { PaginatedAction } from './../../../../../store/src/types/pagination.types';
import { HelmInstallValues } from './helm.types';

export const GET_MONOCULAR_CHARTS = '[Monocular] Get Charts';
export const GET_MONOCULAR_CHARTS_SUCCESS = '[Monocular] Get Charts Success';
export const GET_MONOCULAR_CHARTS_FAILURE = '[Monocular] Get Charts Failure';

export const GET_HELM_RELEASES = '[Helm] Get Releases';
export const GET_HELM_RELEASES_SUCCESS = '[Helm] Get Releases Success';
export const GET_HELM_RELEASES_FAILURE = '[Helm] Get Releases Failure';

export const GET_HELM_VERSIONS = '[Helm] Get Versions';
export const GET_HELM_VERSIONS_SUCCESS = '[Helm] Get Versions Success';
export const GET_HELM_VERSIONS_FAILURE = '[Helm] Get Versions Failure';

export const GET_HELM_RELEASE_STATUS = '[Helm] Get Release Status';
export const GET_HELM_RELEASE_STATUS_SUCCESS = '[Helm] Get Release Status Success';
export const GET_HELM_RELEASE_STATUS_FAILURE = '[Helm] Get Release Status Failure';

export const GET_HELM_RELEASE_PODS = '[Helm] Get Release Pods';
export const GET_HELM_RELEASE_PODS_SUCCESS = '[Helm] Get Release Pods Success';
export const GET_HELM_RELEASE_PODS_FAILURE = '[Helm] Get Release Pods Failure';

export const GET_HELM_RELEASE_SERVICES = '[Helm] Get Release Services';
export const GET_HELM_RELEASE_SERVICES_SUCCESS = '[Helm] Get Release Services Success';
export const GET_HELM_RELEASE_SERVICES_FAILURE = '[Helm] Get Release Services Failure';

export const HELM_INSTALL = '[Helm] Install';
export const HELM_INSTALL_SUCCESS = '[Helm] Install Success';
export const HELM_INSTALL_FAILURE = '[Helm] Install Failure';

export interface MonocularPaginationAction extends PaginatedAction, EntityRequestAction { }

export class GetMonocularCharts implements MonocularPaginationAction {
  constructor() {
    this.paginationKey = 'monocular-charts';
  }
  type = GET_MONOCULAR_CHARTS;
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = monocularChartsSchemaKey;
  entity = [helmEntityFactory(monocularChartsSchemaKey)];
  actions = [
    GET_MONOCULAR_CHARTS,
    GET_MONOCULAR_CHARTS_SUCCESS,
    GET_MONOCULAR_CHARTS_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}


export class GetHelmReleases implements MonocularPaginationAction {
  constructor() {
    this.paginationKey = 'helm-releases';
  }
  type = GET_HELM_RELEASES;
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = helmReleaseSchemaKey;
  entity = [helmEntityFactory(helmReleaseSchemaKey)];
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

export class GetHelmVersions implements MonocularPaginationAction {
  constructor() {
    this.paginationKey = 'helm-versions';
  }
  type = GET_HELM_VERSIONS;
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = helmVersionsSchemaKey;
  entity = [helmEntityFactory(helmVersionsSchemaKey)];
  actions = [
    GET_HELM_VERSIONS,
    GET_HELM_VERSIONS_SUCCESS,
    GET_HELM_VERSIONS_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'asc',
    'order-direction-field': 'version',
  };
}

export class GetHelmReleaseStatus implements EntityRequestAction {
  key: string;
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.key = `${endpointGuid}/${releaseTitle}`;
  }
  type = GET_HELM_RELEASE_STATUS;
  endpointType = HELM_ENDPOINT_TYPE;
  entity = helmEntityFactory(helmReleaseStatusSchemaKey);
  entityType = helmReleaseStatusSchemaKey;
  actions = [
    GET_HELM_RELEASE_STATUS,
    GET_HELM_RELEASE_STATUS_SUCCESS,
    GET_HELM_RELEASE_STATUS_FAILURE
  ];
}

export class GetHelmReleasePods implements MonocularPaginationAction {
  constructor(
    public endpointGuid: string,
    public releaseTitle: string
  ) {
    this.paginationKey = `${endpointGuid}/${releaseTitle}/pods`;
  }
  type = GET_HELM_RELEASE_PODS;
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = helmReleasePodKey;
  entity = [helmEntityFactory(helmReleasePodKey)];
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
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = helmReleaseServiceKey;
  entity = [helmEntityFactory(helmReleaseServiceKey)];
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

export class HelmInstall implements Action {
  constructor(public values: HelmInstallValues) { }
  type = HELM_INSTALL;
  public guid = () => '<New Release>' + this.values.releaseName;
}
