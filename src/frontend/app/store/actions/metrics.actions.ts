import { Action } from '@ngrx/store';

export const METRICS_START = '[Metrics] Start';
export const METRICS_START_SUCCESS = '[Metrics] Start succeeded';
export const METRICS_START_FAILED = '[Metrics] Start failed';

//https://localhost:4200/pp/v1/proxy/v2/apps/4e9b7827-d787-4f89-9077-8d9507d8c715/routes?results-per-page=100&inline-relations-depth=1&page=1&order-direction=desc&order-direction-field=rout

export abstract class MetricsAction implements Action {
    type = METRICS_START;
    url: string;
    query: string;
    guid: string;
    cfGuid: string;
    static getBaseMetricsURL() {
        return `/pp/v1/proxy/v2/`;
    }
}

export class FetchCFMetricsAction extends MetricsAction {
    constructor(public cfGuid: string, public query: string) {
        super();
        this.url = `${MetricsAction.getBaseMetricsURL()}/cf`;
    }
}

export class FetchApplicationMetricsAction extends MetricsAction {
    constructor(public guid: string, public cfGuid: string, public query: string) {
        super();
        this.url = `${MetricsAction.getBaseMetricsURL()}/cf/app`;
    }
}
