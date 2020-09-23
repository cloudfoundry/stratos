

export enum CfRelationTypes {
  /**
   * Metrics endpoint provides cf metrics to a cloud foundry endpoint
   */
  METRICS_CF = 'metrics-cf', // TODO: RC check where this is used, understand how effects new type. where should it live?
  /**
   * Metrics endpoint provides eirini (kube) metrics to a cloud foundry endpoint
   */
  METRICS_EIRINI = 'metrics-eirini'
}