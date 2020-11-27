import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { HelmUpgradeValues } from '../../../helm/store/helm.types';
import {
  GetHelmRelease,
  GetHelmReleaseGraph,
  GetHelmReleaseHistory,
  GetHelmReleaseResource,
  GetHelmReleases,
  UpgradeHelmRelease,
} from './workloads.actions';

export interface WorkloadReleaseBuilders extends OrchestratedActionBuilders {
  get: (
    title: string,
    endpointGuid: string,
    extraArgs: { namespace: string, }
  ) => GetHelmRelease;
  getMultiple: () => GetHelmReleases;
  upgrade: (
    title: string,
    endpointGuid: string,
    namespace: string,
    values: HelmUpgradeValues) => UpgradeHelmRelease;
}

export const workloadReleaseBuilders: WorkloadReleaseBuilders = {
  get: (title: string, endpointGuid: string, { namespace }: { namespace: string, }) => {
    return new GetHelmRelease(endpointGuid, namespace, title);
  },
  getMultiple: () => new GetHelmReleases(),
  upgrade: (
    title: string,
    endpointGuid: string,
    namespace: string,
    values: HelmUpgradeValues) => new UpgradeHelmRelease(title, endpointGuid, namespace, values)
};

export interface WorkloadGraphBuilders extends OrchestratedActionBuilders {
  get: (
    releaseTitle: string,
    endpointGuid: string
  ) => GetHelmReleaseGraph;
}

export const workloadGraphBuilders: WorkloadGraphBuilders = {
  get: (releaseTitle: string, endpointGuid: string) => new GetHelmReleaseGraph(endpointGuid, releaseTitle)
};

export interface WorkloadResourceBuilders extends OrchestratedActionBuilders {
  get: (
    releaseTitle: string,
    endpointGuid: string,
  ) => GetHelmReleaseResource;
}

export const workloadResourceBuilders: WorkloadResourceBuilders = {
  get: (releaseTitle: string, endpointGuid: string) => new GetHelmReleaseResource(endpointGuid, releaseTitle)
};

export interface WorkloadResourceHistoryBuilders extends OrchestratedActionBuilders {
  get: (
    releaseTitle: string,
    endpointGuid: string,
    extraArgs: { namespace: string, }
  ) => GetHelmReleaseHistory;
}

export const workloadResourceHistoryBuilders: WorkloadResourceHistoryBuilders = {
  get: (releaseTitle: string, endpointGuid: string, { namespace }: { namespace: string, }) =>
    new GetHelmReleaseHistory(endpointGuid, namespace, releaseTitle)
};

