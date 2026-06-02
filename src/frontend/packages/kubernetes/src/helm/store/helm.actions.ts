import { Action, EndpointModel } from '../../../../store/src/public-api';

import { PaginatedAction } from '../../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../../store/src/types/request.types';
import {
  HELM_ENDPOINT_TYPE,
  helmEntityFactory,
  monocularChartsEntityType,
} from '../helm-entity-factory';

export const GET_MONOCULAR_CHARTS = '[Monocular] Get Charts';
export const GET_MONOCULAR_CHARTS_SUCCESS = '[Monocular] Get Charts Success';
export const GET_MONOCULAR_CHARTS_FAILURE = '[Monocular] Get Charts Failure';

export const HELM_SYNCHRONISE = '[Helm] Synchronise';

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

export class HelmSynchronise implements Action {
  public type = HELM_SYNCHRONISE;
  public guid: string;

  constructor(public endpoint: EndpointModel) {
    this.guid = endpoint.guid;
  }
}
