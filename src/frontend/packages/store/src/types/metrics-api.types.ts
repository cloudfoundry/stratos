// Shapes of the Prometheus targets / Stratos-info enrichment carried on
// EndpointModel.metadata. Relocated from the deleted metrics-api.actions.ts
// (the ngrx MetricsAPIAction/MetricsStratosAction surface) — these fields are
// optional metadata describing a metrics endpoint; the action/effect/reducer
// machinery that once populated them was removed in W-a4.
export interface MetricsAPITargets {
  activeTargets: {
    labels: {
      job: string
    }
  }[];
  droppedTargets: {
    discoveredLabels: {
      job: string
    }
  }[];
}

export interface MetricsStratosInfo {
  name: string;
}
