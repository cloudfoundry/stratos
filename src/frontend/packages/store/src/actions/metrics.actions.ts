export interface IMetricQueryConfigParams {
  window?: string;
  [key: string]: string | number | undefined;
}

function joinParams(queryConfig: MetricQueryConfig) {
  const {
    window = '',
    ...params
  } = queryConfig.params || {};
  // Skip the auto-injected `{}` when the raw metric already has its own label selectors.
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
