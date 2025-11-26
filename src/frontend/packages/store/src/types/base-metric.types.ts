import type { MetricQueryConfig } from '../actions/metrics.actions';

export enum MetricResultTypes {
  MATRIX = 'matrix',
  VECTOR = 'vector',
  SCALAR = 'scalar',
  STRING = 'string'
}

export interface IMetricsResponse<T = unknown> {
  status: string;
  data: IMetrics<T>;
}

export interface IMetricsData<T = unknown> {
  resultType: string;
  result: [T];
}
export interface IMetrics<T = unknown> {
  query: MetricQueryConfig;
  windowValue: string;
  data: IMetricsData<T>;
}

interface IVectorResult<T> {
  metric: T;
}
// [unixTimeStamp, sampleValue]
export type IMetricSample = [number, string];

export interface IMetricMatrixResult<T = unknown> extends IVectorResult<T> {
  values: IMetricSample[];
}

export interface IMetricVectorResult<T = unknown> extends IVectorResult<T> {
  value: IMetricSample;
}

// They're the same interface but I'm going to keep both for continuity.
export type IMetricScalarResult = IMetricSample[];
export type IMetricStringsResult = IMetricSample[];

export interface ChartSeries<T = unknown> {
  name: string;
  metadata: Record<string, unknown>;
  series: {
    name: string | Date;
    value: T;
  }[];
}

export type MetricsFilterSeries = (chartSeries: ChartSeries[]) => ChartSeries[];
