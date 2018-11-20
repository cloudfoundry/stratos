export interface AppAutoscalerPolicy {
  guid: string;
}

export interface AppAutoscalerHealth {
  status: boolean;
  error: {
    cloudfoundry_autoscaler: string;
    cloudfoundry_autoscaler_timestamp: string;
  }
}

export interface AppAutoscalerScalingHistory {
}
