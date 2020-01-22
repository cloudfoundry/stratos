export interface MonocularRepository {
  name: string;
  url: string;
  created: string;
  syncInterval: number;
  lastSync: number;
  status: string;
}

export interface MonocularChart {
  id: string;
  name: string;
  attributes: {
    description: string;
    home: string;
    icon: string;
    keywords: string[];
    repo: {
      name: string;
      url: string;
    };
  };
  relationships: {
    latestChartVersion: {
      data: {
        version: string
      }
    }
  };
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



export interface HelmInstallValues {
  endpoint: string;
  releaseName: string;
  releaseNamespace: string;
  values: string;
  chart: string;
}
