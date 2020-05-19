import { AutoscalerQuery } from './app-autoscaler.actions';

export interface AutoscalerInfo {
  name: string;
  build: string;
  support: string;
  description: string;
}

export interface AppAutoscalerPolicy {
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
  unit?: string;
}

export interface AppScalingTrigger {
  upper: AppScalingRule[];
  lower: AppScalingRule[];
  query?: AutoscalerQuery;
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
  enabled: boolean;
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

export interface AppAutoscalerMetricData {
  app_id: string;
  name: string;
  timestamp: number;
  unit: string;
  value: string;
  chartMaxValue?: string;
}

export interface AppAutoscalerMetricDataLocal {
  latest: {
    target: AppAutoscalerMetricDataPoint[],
    colorTarget: AppAutoscalerMetricDataPoint[]
  };
  formated: {
    target: AppAutoscalerMetricDataPoint[],
    colorTarget: AppAutoscalerMetricDataPoint[]
  };
  markline: AppAutoscalerMetricDataLine[];
  unit: string;
  chartMaxValue: number;
}

export interface AppAutoscalerMetricDataPoint {
  name: string;
  value: number | string;
  time?: number;
}

export interface AppAutoscalerMetricLegend {
  name: string;
  value: string;
}

export interface AppAutoscalerMetricDataLine {
  name: string;
  series: AppAutoscalerMetricDataPoint[];
}

export interface AppAutoscalerMetricMapInfo {
  unit_internal: string;
  interval: number;
}

export interface AppAutoscalerMetricBasicInfo {
  interval: number;
  unit: string;
  chartMaxValue: number;
}

export interface AppAutoscalerFetchPolicyFailedResponse {
  status: number;
  noPolicy: boolean;
  code?: string;
  message?: string;
}

export interface AppAutoscalerInvalidPolicyError {
  alertInvalidPolicyTriggerMetricName?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyTriggerThreshold100?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyTriggerThresholdRange?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyTriggerStepRange?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyScheduleDateBeforeNow?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyScheduleEndDateBeforeStartDate?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyScheduleStartDateTimeBeforeNow?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyScheduleSpecificConflict?: AppAutoscalerInvalidPolicyErrorEntity;
  alertInvalidPolicyScheduleEndDateTimeBeforeNow?: AppAutoscalerInvalidPolicyErrorEntity;
}

export interface AppAutoscalerInvalidPolicyErrorEntity {
  value?: string | number;
}

export interface AppAutoscaleMetricChart {
  name: string;
  unit: string;
}

export interface AppAutoscalerCredential {
  username: string;
  password: string;
  app_id?: string;
  url?: string;
}
