export interface IMetricApplication {
  __name__: string;
  application_id: string;
  bosh_deployment: string;
  bosh_job_id: string;
  bosh_job_ip?: string;
  bosh_job_name: string;
  instance: string;
  instance_index: string;
  job: string;
  origin: string;
}

export interface IMetricCell {
  __name__: string;
  bosh_deployment: string;
  bosh_job_id: string;
  bosh_job_name: string;
  environment: string;
  instance: string;
  instance_index: string;
  job: string;
  origin: string;
}

export enum MetricQueryType {
  QUERY = 'query',
  RANGE_QUERY = 'query_range'
}
