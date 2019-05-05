export interface AppAutoscalerPolicy {
  enabled: boolean;
  instance_min_count: number;
  instance_max_count: number;
  scaling_rules?: AppScalingRule[];
  schedules?: {
    timezone: string,
    recurring_schedule?: AppRecurringSchedule[],
    specific_date?: AppSpecificDate[]
  };
}

export interface AppSpecificDate {
  end_date_time: string;
  initial_min_instance_count?: number;
  instance_max_count: number;
  instance_min_count: number;
  start_date_time: string;
}

export interface AppScalingRule {
  adjustment: string;
  breach_duration_secs?: number;
  color?: string;
  cool_down_secs?: number;
  metric_type: string;
  operator: string;
  threshold: number;
}

export interface AppScalingTrigger {
  upper?: AppScalingRule[];
  lower?: AppScalingRule[];
}

export interface AppRecurringSchedule {
  initial_min_instance_count?: number;
  instance_min_count: number;
  instance_max_count: number;
  start_time: string;
  end_time: string;
  days_of_month?: number[];
  days_of_week?: number[];
  start_date?: string;
  end_date?: string;
}

export interface AppAutoscalerPolicyLocal extends AppAutoscalerPolicy {
  scaling_rules_form: AppScalingRule[];
  scaling_rules_map: {
    [metricName: string]: AppScalingTrigger
  };
}

export interface AppAutoscalerHealth {
  entity: {
    uptime: number;
  };
}

export interface AppAutoscalerScalingHistory {
  next_url: string;
  prev_url: string;
  page: number;
  resources: AppAutoscalerEvent[];
  total_pages: number;
  total_results: number;
}

export interface AppAutoscalerEvent {
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

export interface AppAutoscalerAppMetric {
  next_url: string;
  prev_url: string;
  page: number;
  resources: AppAutoscalerMetric[];
  total_pages: number;
  total_results: number;
}

export interface AppAutoscalerMetric {
  app_id: string;
  name: string;
  timestamp: number;
  unit: string;
  value: string;
}
