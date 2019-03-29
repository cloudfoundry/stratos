import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { PaginatedAction } from './../../../../../store/src/types/pagination.types';
import { IRequestAction } from './../../../../../store/src/types/request.types';
import { helmReleasesSchemaKey, helmVersionsSchemaKey, monocularChartsSchemaKey } from './helm.entities';

export const GET_MONOCULAR_CHARTS = '[Monocular] Get Charts';
export const GET_MONOCULAR_CHARTS_SUCCESS = '[Monocular] Get Charts Success';
export const GET_MONOCULAR_CHARTS_FAILURE = '[Monocular] Get Charts Failure';

export const GET_HELM_RELEASES = '[Helm] Get Releases';
export const GET_HELM_RELEASES_SUCCESS = '[Helm] Get Releases Success';
export const GET_HELM_RELEASES_FAILURE = '[Helm] Get Releases Failure';

export const GET_HELM_VERSIONS = '[Helm] Get Versions';
export const GET_HELM_VERSIONS_SUCCESS = '[Helm] Get Versions Success';
export const GET_HELM_VERSIONS_FAILURE = '[Helm] Get Versions Failure';


export interface MonocularPaginationAction extends PaginatedAction, IRequestAction { }

export class GetMonocularCharts implements MonocularPaginationAction {
  constructor() {
    this.paginationKey = 'monocular-charts';
  }
  type = GET_MONOCULAR_CHARTS;
  entityKey = monocularChartsSchemaKey;
  entity = [entityFactory(monocularChartsSchemaKey)];
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
  entityKey = helmReleasesSchemaKey;
  entity = [entityFactory(helmReleasesSchemaKey)];
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
  entityKey = helmVersionsSchemaKey;
  entity = [entityFactory(helmVersionsSchemaKey)];
  actions = [
    GET_HELM_VERSIONS,
    GET_HELM_VERSIONS_SUCCESS,
    GET_HELM_VERSIONS_FAILURE
  ];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}
