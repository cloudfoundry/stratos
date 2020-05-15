import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetHelmVersions, GetMonocularCharts } from './helm.actions';

export interface HelmChartActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetMonocularCharts
}

export const helmChartActionBuilders: HelmChartActionBuilders = {
  getMultiple: () => new GetMonocularCharts()
}

export interface HelmVersionActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetHelmVersions
}

export const helmVersionActionBuilders: HelmVersionActionBuilders = {
  getMultiple: () => new GetHelmVersions()
}