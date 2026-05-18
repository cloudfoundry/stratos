import { MetricQueryConfig, MetricQueryType } from '@stratosui/store';
import { FetchApplicationMetricsAction } from '../../../../../actions/cf-metrics.actions';

export function createAppInstancesMetricAction(appGuid: string, cfGuid: string): FetchApplicationMetricsAction {
  return new FetchApplicationMetricsAction(
    appGuid,
    cfGuid,
    new MetricQueryConfig('firehose_container_metric_cpu_percentage'),
    MetricQueryType.QUERY
  );
}
