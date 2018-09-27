import { metricSchemaKey } from '../helpers/entity-factory';
import { IRequestAction } from '../types/request.types';
import { environment } from './../../../environments/environment.prod';
import { PaginatedAction } from '../types/pagination.types';

export const METRICS_START = '[Metrics] Fetch Start';
export const METRICS_START_SUCCESS = '[Metrics] Fetch Succeeded';
export const METRICS_START_FAILED = '[Metrics] Fetch Failed';
const { proxyAPIVersion } = environment;

export enum MetricQueryType {
  QUERY = 'query',
  RANGE_QUERY = 'query_range'
}
export interface IMetricQueryConfigParams {
  window?: string;
  [key: string]: string | number;
}
export class MetricQueryConfig {
  constructor(
    public metric: string,
    public params?: IMetricQueryConfigParams
  ) { }
  public getFullQuery() {
    return this.metric + this.joinParams();
  }

  public joinParams() {
    const {
      window = '',
      ...params
    } = this.params || {};
    const windowString = window ? `{}[${window}]` : '';
    const paramString = Object.keys(params).reduce((accum, key) => {
      return accum + `&${key}=${params[key]}`;
    }, '');
    return windowString + paramString || '';
  }
}

export abstract class MetricsAction implements IRequestAction {
  constructor(public guid: string, public query: MetricQueryConfig, public queryType: MetricQueryType = MetricQueryType.QUERY) {
    this.metricId = MetricsAction.buildMetricKey(guid, query);
  }
  entityKey = metricSchemaKey;
  type = METRICS_START;
  url: string;
  cfGuid: string;
  metricId: string;
  static getBaseMetricsURL() {
    return `/pp/${proxyAPIVersion}/metrics`;
  }

  // Builds the key that is used to store the metric in the app state.
  static buildMetricKey(guid: string, query: MetricQueryConfig) {
    // TODO: RC add params
    return `${guid}:${query.metric}`;
  }
}

export class FetchCFMetricsAction extends MetricsAction {
  public cfGuid: string;
  constructor(cfGuid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(cfGuid, query, queryType);
    this.cfGuid = cfGuid;
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
  }
}

export class FetchCFCellMetricsAction extends MetricsAction {
  public cfGuid: string;
  constructor(cfGuid: string, cellId: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(cfGuid + '-' + cellId, query, queryType);
    this.cfGuid = cfGuid;
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
  }
}

export class FetchCFMetricsPaginatedAction extends FetchCFMetricsAction implements PaginatedAction {
  constructor(cfGuid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(cfGuid, query, queryType);
    this.paginationKey = this.metricId;
  }
  actions = [];
  paginationKey: string;
  // TODO: RC Move this to DataSource
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'id',
  };
}

export class FetchApplicationMetricsAction extends MetricsAction {
  constructor(guid: string, public cfGuid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, query, queryType);
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`;
  }

}
