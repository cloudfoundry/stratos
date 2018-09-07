import { Action } from '@ngrx/store';
import { environment } from './../../../environments/environment.prod';

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
  [key: string]: string;
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
      step = '365',
      ...params
    } = this.params;
    const paramString = Object.keys(params).reduce((accum, key) => {
      return accum + `&${key}=${params[key]}`;
    }, '');
    return (window + paramString) || '';
  }
}

export abstract class MetricsAction implements Action {
  constructor(public guid: string, public query: MetricQueryConfig, public queryType: MetricQueryType = MetricQueryType.QUERY) {
    this.metricId = MetricsAction.buildMetricKey(guid, query);
  }
  type = METRICS_START;
  url: string;
  cfGuid: string;
  metricId: string;
  static getBaseMetricsURL() {
    return `/pp/${proxyAPIVersion}/metrics`;
  }

  // Builds the key that is used to store the metric in the app state.
  static buildMetricKey(guid: string, query: MetricQueryConfig) {
    return `${guid}:${query.metric}`;
  }
}

export class FetchCFMetricsAction extends MetricsAction {
  public cfGuid: string;
  constructor(public guid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, query, queryType);
    this.cfGuid = guid;
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
  }
}

export class FetchApplicationMetricsAction extends MetricsAction {
  constructor(guid: string, public cfGuid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, query, queryType);
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`;
  }
}
