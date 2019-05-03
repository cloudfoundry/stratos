export interface AppAutoscalerPolicy {
  instance_min_count: number;
  instance_max_count: number;
  scaling_rules_form: any;
  scaling_rules: any[]; // TODO: RC Typing
  schedules: {
    timezone: string,
    recurring_schedule: any[],
    specific_date: any[]
  };
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

export interface AutoscalerEvent {
  app_id: string;
  error: string;
  message: string;
  new_instances: number;
  old_instances: number;
  reason: string;
  scaling_type: number;
  status: number;
  timestamp: number;
}

