import { environment } from './../../../environments/environment.prod';
import { schema } from 'normalizr';
import { Action } from '@ngrx/store';

export const METRICS_START = '[Metrics] Start';
export const METRICS_START_SUCCESS = '[Metrics] Start succeeded';
export const METRICS_START_FAILED = '[Metrics] Start failed';
const { proxyAPIVersion } = environment;

export const metricsKey = 'metrics';
export const metricSchema = new schema.Entity(metricsKey);

export abstract class MetricsAction implements Action {
    type = METRICS_START;
    url: string;
    query: string;
    guid: string;
    cfGuid: string;
    static getBaseMetricsURL() {
        return `/pp/${proxyAPIVersion}/metrics`;
    }
}

export class FetchCFMetricsAction extends MetricsAction {
    public cfGuid: string;
    constructor(public guid: string, public query: string) {
        super();
        this.cfGuid = guid;
        this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
    }
}

export class FetchApplicationMetricsAction extends MetricsAction {
    constructor(public guid: string, public cfGuid: string, public query: string) {
        super();
        this.url = `${MetricsAction.getBaseMetricsURL()}/cf/app/${guid}`;
    }
}
