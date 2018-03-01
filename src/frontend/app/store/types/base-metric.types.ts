interface IMetricsResponse<T = any> {
    status: string;
    data: IMetrics<T>;
}

interface IMetrics<T = any> {
    resultType: string;
    result: IMetricResult<T>[];
}

interface IMetricResult<T> {
    metric: T;
    value: (number | string)[];
}

interface IMetric {
    __name__: string;
    application_id: string;
    bosh_deployment: string;
    bosh_job_id: string;
    bosh_job_ip: string;
    bosh_job_name: string;
    instance: string;
    instance_index: string;
    job: string;
    origin: string;
}