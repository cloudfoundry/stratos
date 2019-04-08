export interface AppAutoscalerPolicy {
  instance_min_count: number;
  instance_max_count: number;
  scaling_rules_form: any;
  schedules: any;
}

export interface AppAutoscalerHealth {
  entity: {
    uptime: number;
  };
}

export interface AppAutoscalerScalingHistory {
  total_results: number;
}

export interface AppAutoscalerAppMetric {
  total_results: number;
}

export interface AppAutoscalerInsMetric {
  total_results: number;
}

export interface UpdateAutoscalerPolicyState {
  policy: AppAutoscalerPolicy;
}
