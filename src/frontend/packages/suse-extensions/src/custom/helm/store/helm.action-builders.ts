import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { GetHelmChartVersions, GetHelmVersions, GetMonocularCharts, HelmInstall, HelmSynchronise } from './helm.actions';
import { HelmInstallValues } from './helm.types';

export interface HelmChartActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetMonocularCharts,
  // Helm install added to chart action builder and not helm release/workload to ensure action & effect are available in this module
  // (others may not have loaded)
  install: (values: HelmInstallValues) => HelmInstall,
  synchronise: (endpoint: EndpointModel) => HelmSynchronise;
}

export const helmChartActionBuilders: HelmChartActionBuilders = {
  getMultiple: () => new GetMonocularCharts(),
  install: (values: HelmInstallValues) => new HelmInstall(values),
  synchronise: (endpoint: EndpointModel) => new HelmSynchronise(endpoint)
};

export interface HelmVersionActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetHelmVersions;
}

export const helmVersionActionBuilders: HelmVersionActionBuilders = {
  getMultiple: () => new GetHelmVersions()
};

export interface HelmChartVersionsActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    extraArgs: {
      monocularEndpoint: string,
      repoName: string,
      chartName: string;
    }) => GetHelmChartVersions;
}

export const helmChartVersionsActionBuilders: HelmChartVersionsActionBuilders = {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    extraArgs: {
      monocularEndpoint: string,
      repoName: string,
      chartName: string;
    }) =>
    new GetHelmChartVersions(extraArgs.monocularEndpoint, extraArgs.repoName, extraArgs.chartName)
};
