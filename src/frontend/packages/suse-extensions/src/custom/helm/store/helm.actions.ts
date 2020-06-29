import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../../../store/src/types/request.types';
import {
  HELM_ENDPOINT_TYPE,
  helmEntityFactory,
  helmVersionsEntityType,
  monocularChartsEntityType,
} from '../helm-entity-factory';
import { HelmInstallValues } from './helm.types';

export const GET_MONOCULAR_CHARTS = '[Monocular] Get Charts';
export const GET_MONOCULAR_CHARTS_SUCCESS = '[Monocular] Get Charts Success';
export const GET_MONOCULAR_CHARTS_FAILURE = '[Monocular] Get Charts Failure';

export const GET_HELM_VERSIONS = '[Helm] Get Versions';
export const GET_HELM_VERSIONS_SUCCESS = '[Helm] Get Versions Success';
export const GET_HELM_VERSIONS_FAILURE = '[Helm] Get Versions Failure';

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
  entityType = monocularChartsEntityType;
  entity = [helmEntityFactory(monocularChartsEntityType)];
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
  flattenPagination = true;
}

export class HelmInstall implements EntityRequestAction {
  type = HELM_INSTALL;
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = monocularChartsEntityType;
  guid: string;
  constructor(public values: HelmInstallValues) {
    this.guid = '<New Release>' + this.values.releaseName;
  }
}

export class GetHelmVersions implements MonocularPaginationAction {
  constructor() {
    this.paginationKey = 'helm-versions';
  }
  type = GET_HELM_VERSIONS;
  endpointType = HELM_ENDPOINT_TYPE;
  entityType = helmVersionsEntityType;
  entity = [helmEntityFactory(helmVersionsEntityType)];
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
  flattenPagination = true;
}
