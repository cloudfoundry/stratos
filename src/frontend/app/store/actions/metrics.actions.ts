import { MetricQueryType } from '../../shared/services/metrics-range-selector.types';
import { metricSchemaKey } from '../helpers/entity-factory';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';
import { environment } from './../../../environments/environment.prod';

export const METRICS_START = '[Metrics] Fetch Start';
export const METRICS_START_SUCCESS = '[Metrics] Fetch Succeeded';
export const METRICS_START_FAILED = '[Metrics] Fetch Failed';

const { proxyAPIVersion } = environment;

export interface IMetricQueryConfigParams {
  window?: string;
  [key: string]: string | number;
}

function joinParams(queryConfig: MetricQueryConfig) {
  const {
    window = '',
    ...params
  } = queryConfig.params || {};
  // If the query contains it's own curly brackets don't add a new set
  const hasSquiggly = queryConfig.metric.indexOf('}') >= 0;
  const windowString = window ? `${(hasSquiggly ? '' : '{}')}[${window}]` : '';
  const paramString = Object.keys(params).reduce((accum, key) => accum + `&${key}=${params[key]}`, '');
  return windowString + paramString || '';
}

export function getFullMetricQueryQuery(queryConfig: MetricQueryConfig) {
  return queryConfig.metric + joinParams(queryConfig);
}

export class MetricQueryConfig {
  constructor(
    public metric: string,
    public params?: IMetricQueryConfigParams
  ) { }
}

export class MetricsAction implements IRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public query: MetricQueryConfig,
    public url: string,
    public queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true) {
    this.metricId = MetricsAction.buildMetricKey(guid, query, isSeries);
  }
  entityKey = metricSchemaKey;
  type = METRICS_START;
  metricId: string;
  directApi = false;
  static getBaseMetricsURL() {
    return `/pp/${proxyAPIVersion}/metrics`;
  }

  // Builds the key that is used to store the metric in the app state.
  static buildMetricKey(guid: string, query: MetricQueryConfig, isSeries: boolean) {
    return `${guid}:${query.metric}:${isSeries ? 'series' : 'value'}`;
  }
}

export class FetchCFMetricsAction extends MetricsAction {
  constructor(
    guid: string,
    cfGuid: string,
    public query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true) {
    super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf`, queryType, isSeries);
  }
}

export class FetchCFCellMetricsAction extends MetricsAction {
  constructor(
    cfGuid: string,
    cellId: string,
    public query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true) {
    super(cfGuid + '-' + cellId, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/cells`, queryType, isSeries);
  }
}

export class FetchCFMetricsPaginatedAction extends FetchCFMetricsAction implements PaginatedAction {
  constructor(
    guid: string,
    cfGuid: string,
    public query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, cfGuid, query, queryType);
    this.paginationKey = this.metricId;
  }
  actions = [];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'id',
  };
}

export class FetchCFCellMetricsPaginatedAction extends FetchCFCellMetricsAction implements PaginatedAction {
  constructor(cfGuid: string, cellId: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(cfGuid, cellId, query, queryType);
    this.paginationKey = this.metricId;
  }
  actions = [];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'id',
  };
}

export class FetchApplicationMetricsAction extends MetricsAction {
  constructor(
    guid: string,
    cfGuid: string,
    query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true) {
    super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`, queryType, isSeries);
  }

}
