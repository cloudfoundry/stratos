import {
  OrchestratedActionBuilders,
} from '../../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { HelmInstallValues } from '../../../helm/store/helm.types';
import {
  GetHelmRelease,
  GetHelmReleaseGraph,
  GetHelmReleaseResource,
  GetHelmReleases,
  HelmInstall,
} from './workloads.actions';

export interface WorkloadReleaseBuilders extends OrchestratedActionBuilders {
  get: (
    title: string,
    endpointGuid: string,
    extraArgs: { namespace: string }
  ) => GetHelmRelease;
  getMultiple: () => GetHelmReleases;
  install: (values: HelmInstallValues) => HelmInstall
}

export const workloadReleaseBuilders: WorkloadReleaseBuilders = {
  get: (title: string, endpointGuid: string, { namespace }: { namespace: string }) => {
    return new GetHelmRelease(endpointGuid, namespace, title);
  },
  getMultiple: () => new GetHelmReleases(),
  install: (values: HelmInstallValues) => new HelmInstall(values)
}

export interface WorkloadGraphBuilders extends OrchestratedActionBuilders {
  get: (
    releaseTitle: string,
    endpointGuid: string
  ) => GetHelmReleaseGraph
}

export const workloadGraphBuilders: WorkloadGraphBuilders = {
  get: (releaseTitle: string, endpointGuid: string) => new GetHelmReleaseGraph(endpointGuid, releaseTitle)
}

export interface WorkloadResourceBuilders extends OrchestratedActionBuilders {
  get: (
    releaseTitle: string,
    endpointGuid: string,
  ) => GetHelmReleaseResource
}

export const workloadResourceBuilders: WorkloadResourceBuilders = {
  get: (releaseTitle: string, endpointGuid: string) => new GetHelmReleaseResource(endpointGuid, releaseTitle)
}