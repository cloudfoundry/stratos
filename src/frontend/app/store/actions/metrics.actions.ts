import { Action } from '@ngrx/store';
import { environment } from './../../../environments/environment.prod';

export const METRICS_START = '[Metrics] Start';
export const METRICS_START_SUCCESS = '[Metrics] Start succeeded';
export const METRICS_START_FAILED = '[Metrics] Start failed';
const { proxyAPIVersion } = environment;

export enum MetricQueryType {
  QUERY = 'query',
  RANGE_QUERY = 'query_range'
}

export abstract class MetricsAction implements Action {
  constructor(public guid: string, public query: string, public queryType: MetricQueryType = MetricQueryType.QUERY) {
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
  static buildMetricKey(guid: string, query: string) {
    return `${guid}:${query}`;
  }
}

export class FetchCFMetricsAction extends MetricsAction {
  public cfGuid: string;
  constructor(public guid: string, public query: string, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, query, queryType);
    this.cfGuid = guid;
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
  }
}

export class FetchApplicationMetricsAction extends MetricsAction {
  constructor(guid: string, public cfGuid: string, public query: string, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, query, queryType);
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`;
  }
}
