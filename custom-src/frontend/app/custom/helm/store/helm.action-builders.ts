import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetHelmVersions, GetMonocularCharts, HelmInstall } from './helm.actions';
import { HelmInstallValues } from './helm.types';

export interface HelmChartActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetMonocularCharts,
  // Helm install added to chart action builder and not helm release/workload to ensure action & effect are available in this module
  // (others may not have loaded)
  install: (values: HelmInstallValues) => HelmInstall
}

export const helmChartActionBuilders: HelmChartActionBuilders = {
  getMultiple: () => new GetMonocularCharts(),
  install: (values: HelmInstallValues) => new HelmInstall(values)
}

export interface HelmVersionActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetHelmVersions
}

export const helmVersionActionBuilders: HelmVersionActionBuilders = {
  getMultiple: () => new GetHelmVersions()
}