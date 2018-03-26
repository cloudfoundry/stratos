import { environment } from './../../../environments/environment.prod';
import { schema } from 'normalizr';
import { Action } from '@ngrx/store';

export const METRICS_START = '[Metrics] Start';
export const METRICS_START_SUCCESS = '[Metrics] Start succeeded';
export const METRICS_START_FAILED = '[Metrics] Start failed';
const { proxyAPIVersion } = environment;

export abstract class MetricsAction implements Action {
  constructor(guid: string, query: string) {
    this.metricId = MetricsAction.buildMetricKey(guid, query);
  }
  type = METRICS_START;
  url: string;
  query: string;
  guid: string;
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
  constructor(public guid: string, public query: string) {
    super(guid, query);
    this.cfGuid = guid;
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
  }
}

export class FetchApplicationMetricsAction extends MetricsAction {
  constructor(public guid: string, public cfGuid: string, public query: string) {
    super(guid, query);
    this.url = `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`;
  }
}
