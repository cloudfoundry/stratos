import { metricEntityType } from '../../../core/src/base-entity-schemas';
import { environment } from '../../../core/src/environments/environment';
import { MetricQueryType } from '../../../core/src/shared/services/metrics-range-selector.types';
import { EntityRequestAction } from '../types/request.types';

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
  const windowString = window && !(params.start && params.end) ? `${(hasSquiggly ? '' : '{}')}[${window}]` : '';
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

// FIXME: Final solution for Metrics - STRAT-152
export class MetricsAction implements EntityRequestAction {
  constructor(
    // FIXME: This is ignored in all cases - STRAT-152
    guid: string,
    public endpointGuid: string,
    public query: MetricQueryConfig,
    public url: string,
    public windowValue: string = null,
    public queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true,
    public endpointType: string) {
    this.guid = MetricsAction.buildMetricKey(guid, query, isSeries, queryType, windowValue);
  }
  public guid: string;

  entityType = metricEntityType;
  type = METRICS_START;
  directApi = false;

  static getBaseMetricsURL() {
    return `/pp/${proxyAPIVersion}/metrics`;
  }

  // Builds the key that is used to store the metric in the app state.
  static buildMetricKey(guid: string, query: MetricQueryConfig, isSeries: boolean, queryType: MetricQueryType, windowValue: string = null) {
    return `${guid}:${query.metric}:${isSeries ? 'series' : 'value'}:${queryType}:${windowValue ? windowValue : ''}`;
  }
}

export class MetricsChartAction extends MetricsAction {
  constructor(
    guid: string,
    endpointGuid: string,
    query: MetricQueryConfig,
    url: string,
    endpointType: string
  ) {
    super(
      guid,
      endpointGuid,
      query,
      url,
      null,
      MetricQueryType.RANGE_QUERY,
      true,
      endpointType
    );
  }
}

