import { OrchestratedActionBuilders } from '../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EndpointModel } from '../../../../store/src/public-api';
import { GetMonocularCharts, HelmSynchronise } from './helm.actions';

export interface HelmChartActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetMonocularCharts;
  synchronise: (endpoint: EndpointModel) => HelmSynchronise;
}

export const helmChartActionBuilders: HelmChartActionBuilders = {
  getMultiple: () => new GetMonocularCharts(),
  synchronise: (endpoint: EndpointModel) => new HelmSynchronise(endpoint)
};
