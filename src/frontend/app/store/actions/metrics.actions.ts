import { Action } from '@ngrx/store';
import { environment } from './../../../environments/environment.prod';
import { MetricQueryType } from '../../shared/services/metrics-range-selector.types';

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
  const hasSquiggly = queryConfig.metric.endsWith('}');
  const windowString = window ? `${(hasSquiggly ? '' : '{}')}[${window}]` : '';
  const paramString = Object.keys(params).reduce((accum, key) => {
    return accum + `&${key}=${params[key]}`;
  }, '');
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

export class MetricsAction implements Action {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public query: MetricQueryConfig,
    public url: string,
    public queryType: MetricQueryType = MetricQueryType.QUERY) {
    this.metricId = MetricsAction.buildMetricKey(guid, query);
  }
  type = METRICS_START;
  metricId: string;
  directApi = false;
  static getBaseMetricsURL() {
    return `/pp/${proxyAPIVersion}/metrics`;
  }

  // Builds the key that is used to store the metric in the app state.
  static buildMetricKey(guid: string, query: MetricQueryConfig) {
    return `${guid}:${query.metric}`;
  }
}

export class FetchCFMetricsAction extends MetricsAction {
  public endpointGuid: string;
  constructor(public guid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, guid, query, `${MetricsAction.getBaseMetricsURL()}/cf`, queryType);
  }
}

export class FetchApplicationMetricsAction extends MetricsAction {
  constructor(guid: string, cfGuid: string, query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`, queryType);
  }
}
