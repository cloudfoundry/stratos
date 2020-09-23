import { metricEntityType } from '../helpers/stratos-entity-factory';
import { proxyAPIVersion } from '../jetstream';
import { MetricQueryType } from '../types/metric.types';
import { EntityRequestAction } from '../types/request.types';

export const METRICS_START = '[Metrics] Fetch Start';
export const METRICS_START_SUCCESS = '[Metrics] Fetch Succeeded';
export const METRICS_START_FAILED = '[Metrics] Fetch Failed';

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
    guid: string, // FIXME: This is ignored in all cases - STRAT-152
    public endpointGuid: string,
    public query: MetricQueryConfig,
    public url: string,
    public windowValue: string = null,
    public queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true,
    public endpointType: string,
    buildMetricsKey = true) { // TODO: RC test where this should be set
    this.guid = buildMetricsKey ? MetricsAction.buildMetricKey(guid, query, isSeries, queryType, windowValue) : guid;
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

// export class FetchCFMetricsAction extends MetricsAction {
//   constructor(
//     guid: string,
//     cfGuid: string,
//     public query: MetricQueryConfig,
//     queryType: MetricQueryType = MetricQueryType.QUERY,
//     isSeries = true) {
//     super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf`, null, queryType, isSeries, CF_ENDPOINT_TYPE); // TODO: RC
//   }
// }

// /**
//  * Fetch cf eirini metrics
//  */
// export class FetchCfEiriniMetricsAction extends MetricsAction {
//   constructor(
//     metricsKey: string,
//     cfGuid: string,
//     public query: MetricQueryConfig,
//     queryType: MetricQueryType = MetricQueryType.QUERY,
//     isSeries = true) {
//     super(
//       metricsKey,
//       cfGuid,
//       query,
//       `${MetricsAction.getBaseMetricsURL()}/cf/eirini`,
//       null,
//       queryType,
//       isSeries,
//       CF_ENDPOINT_TYPE,
//       false
//     );
//   }
// }

// /**
//  *  Fetch cf cell metrics
//  */
// export class FetchCFCellMetricsAction extends MetricsAction {
//   constructor(
//     cfGuid: string,
//     cellId: string,
//     public query: MetricQueryConfig,
//     queryType: MetricQueryType = MetricQueryType.QUERY,
//     isSeries = true) {
//     super(cfGuid + '-' + cellId, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/cells`, null, queryType, isSeries, CF_ENDPOINT_TYPE);
//     console.log('CREATED')
//   }
// }

// /**
//  * Wrapper to FetchCFMetricsAction to allow action to be used in lists
//  */
// export class FetchCFMetricsPaginatedAction extends FetchCFMetricsAction implements PaginatedAction {
//   constructor(guid: string, cfGuid: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
//     super(guid, cfGuid, query, queryType);
//     this.paginationKey = this.guid;
//   }
//   actions = [];
//   paginationKey: string;
//   initialParams = {
//     'order-direction': 'desc',
//     'order-direction-field': 'id',
//   };
// }

// /**
//  * Wrapper to FetchCFCellMetricsAction to allow action to be used in lists
//  */
// export class FetchCFCellMetricsPaginatedAction extends FetchCFCellMetricsAction implements PaginatedAction {
//   constructor(cfGuid: string, cellId: string, public query: MetricQueryConfig, queryType: MetricQueryType = MetricQueryType.QUERY) {
//     super(cfGuid, cellId, query, queryType);
//     this.paginationKey = this.guid;
//   }
//   actions = [];
//   paginationKey: string;
//   initialParams = {
//     'order-direction': 'desc',
//     'order-direction-field': 'id',
//   };
// }

// /**
//  * Fetch cf application metrics
//  */
// export class FetchApplicationMetricsAction extends MetricsAction {
//   constructor(
//     guid: string,
//     cfGuid: string,
//     query: MetricQueryConfig,
//     queryType: MetricQueryType = MetricQueryType.RANGE_QUERY,
//     isSeries = true) {
//     super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`, null, queryType, isSeries, 'TODOGEN');
//   }
// }

// /**
//  * Fetch cf application metrics
//  */
// export class FetchApplicationChartMetricsAction extends MetricsChartAction {
//   constructor(
//     guid: string,
//     cfGuid: string,
//     query: MetricQueryConfig,) {
//     super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`, 'TODOGENCHART');
//   }
// }
