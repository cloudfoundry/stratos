import { MetricQueryConfig, MetricsAction, MetricsChartAction } from '../../../store/src/actions/metrics.actions';
import { MetricQueryType } from '../../../store/src/types/metric.types';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../cf-types';

class CfMetricsAction extends MetricsAction {
  constructor(
    guid: string,
    endpointGuid: string,
    query: MetricQueryConfig,
    url: string,
    windowValue: string = null,
    queryType: MetricQueryType,
    isSeries = true,
  ) {
    super(
      guid,
      endpointGuid,
      query,
      url,
      windowValue,
      queryType,
      isSeries,
      CF_ENDPOINT_TYPE
    );
  }

}

export class FetchCFMetricsAction extends CfMetricsAction {
  constructor(
    guid: string,
    cfGuid: string,
    public query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true) {
    super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf`, null, queryType, isSeries);
  }
}

export class FetchCFCellMetricsAction extends CfMetricsAction {
  constructor(
    cfGuid: string,
    cellId: string,
    public query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY,
    isSeries = true) {
    super(cfGuid + '-' + cellId, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/cells`, null, queryType, isSeries);
  }
}

export class FetchCFMetricsPaginatedAction extends FetchCFMetricsAction implements PaginatedAction {
  constructor(
    guid: string,
    cfGuid: string,
    public query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.QUERY) {
    super(guid, cfGuid, query, queryType);
    this.paginationKey = this.guid;
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
    this.paginationKey = this.guid;
  }
  actions = [];
  paginationKey: string;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'id',
  };
}

export class FetchApplicationMetricsAction extends CfMetricsAction {
  constructor(
    guid: string,
    cfGuid: string,
    query: MetricQueryConfig,
    queryType: MetricQueryType = MetricQueryType.RANGE_QUERY,
    isSeries = true) {
    super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`, null, queryType, isSeries);
  }

}
export class FetchApplicationChartMetricsAction extends MetricsChartAction {
  constructor(
    guid: string,
    cfGuid: string,
    query: MetricQueryConfig, ) {
    super(guid, cfGuid, query, `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`, CF_ENDPOINT_TYPE);
  }

}
