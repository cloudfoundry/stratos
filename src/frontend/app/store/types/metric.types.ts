export interface IMetricApplication {
  __name__: string;
  application_id?: string;
  bosh_deployment: string;
  bosh_job_id: string;
  bosh_job_ip?: string;
  bosh_job_name: string;
  instance: string;
  instance_index?: string;
  job: string;
  origin: string;
}
// TODO: RC search and replace for all cell stuff
export interface IMetricCell {
  __name__: string;
  bosh_deployment: string;
  bosh_job_id: string;
  bosh_job_name: string;
  environment: string;
  instance: string;
  job: string;
  origin: string;
}
