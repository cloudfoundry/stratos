import { Chart } from '../monocular/shared/models/chart';
import { ChartVersion } from '../monocular/shared/models/chart-version';

export interface MonocularRepository {
  name: string;
  url: string;
  created: string;
  syncInterval: number;
  lastSync: number;
  status: string;
}

// Reuse types from the Monocular codebase
export interface MonocularChart extends Chart {
  name: string;
}

export type MonocularVersion = ChartVersion;

// Basic Chart Metadata
export interface ChartMetadata {
  name: string;
  description: string;
  sources: string[];
}

export interface HelmVersion {
  endpointId: string;
  Version?: {
    git_commit: string;
    git_tree_state: string;
    sem_ver: string;
  };
}

export enum HelmStatus {
  Unknown = 0,
  Deployed = 1,
  Deleted = 2,
  Superseded = 3,
  Failed = 4,
  Deleting = 5,
  Pending_Install = 6,
  Pending_Upgrade = 7,
  Pending_Rollback = 8
}

export interface HelmChartReference {
  name: string;
  repo: string;
  version: string;
}

export interface HelmUpgradeInstallValues {
  monocularEndpoint: string;
  values: string;
  chart: HelmChartReference;
  chartUrl: string;
}

export interface HelmInstallValues extends HelmUpgradeInstallValues {
  endpoint: string;
  releaseName: string;
  releaseNamespace: string;
}


export interface HelmUpgradeValues extends HelmUpgradeInstallValues {
  restartPods?: boolean;
}
