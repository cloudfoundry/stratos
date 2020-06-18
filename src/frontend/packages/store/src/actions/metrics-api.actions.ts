import { Action } from '@ngrx/store';

import { proxyAPIVersion } from '../jetstream';

export const METRIC_API_START = '[Metrics] API Start';
export const METRIC_API_SUCCESS = '[Metrics] API Success';
export const METRIC_API_FAILED = '[Metrics] API Failed';


export const MetricAPIQueryTypes = {
  TARGETS: 'targets',
  STRATOS_METADATA: 'stratos'
};

export interface MetricAPIResponse {
  data: any;
  status: string;
}

export interface MetricsAPITargets {
  activeTargets: {
    labels: {
      job: string
    }
  }[];
  droppedTargets: {
    discoveredLabels: {
      job: string
    }
  }[];
}

export interface MetricsStratosInfo {
  name: string;

}

export class MetricsAPIAction implements Action {
  public url;
  constructor(public endpointGuid: string, public query: string, public queryType = MetricAPIQueryTypes.TARGETS) {
    this.url = `/pp/${proxyAPIVersion}/proxy/api/v1/` + query;
  }
  type = METRIC_API_START;
}

export class MetricsStratosAction implements Action {
  public url;
  public queryType = MetricAPIQueryTypes.STRATOS_METADATA;
  constructor(public endpointGuid: string) {
    this.url = `/pp/${proxyAPIVersion}/proxy/stratos`;
  }
  type = METRIC_API_START;
}

export class MetricsAPIActionSuccess implements Action {
  constructor(public endpointGuid: string, public data: MetricAPIResponse, public queryType = MetricAPIQueryTypes.TARGETS) { }
  type = METRIC_API_SUCCESS;
}
