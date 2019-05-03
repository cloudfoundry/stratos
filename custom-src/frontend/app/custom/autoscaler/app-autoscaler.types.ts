export interface AppAutoscalerPolicy {
  enabled: boolean;
  instance_min_count: number;
  instance_max_count: number;
  scaling_rules: AppScalingRule[];
  schedules: {
    timezone: string,
    recurring_schedule: AppRecurringSchedule[],
    specific_date: AppSpecificDate[]
  };
}

export interface AppSpecificDate {
  end_date_time: string;
  initial_min_instance_count: number;
  instance_max_count: number;
  instance_min_count: number;
  start_date_time: string;
}

export interface AppScalingRule {
  adjustment: string;
  metric_type: string;
  operator: string;
  threshold: number;
}

export interface AppRecurringSchedule {
  initial_min_instance_count: number;
  instance_min_count: number;
  instance_max_count: number;
  start_time: string;
  end_time: string;
  days_of_month: number[];
  days_of_week: number[];
  start_date: string;
  end_date: string;
}

export interface AppAutoscalerPolicyLocal extends AppAutoscalerPolicy {
  scaling_rules_form: any; // TODO: RC Typing
  scaling_rules_map: {
    [metricName: string]: {
      upper: { threshold: number }[],
      lower: { threshold: number }[],
    }
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

