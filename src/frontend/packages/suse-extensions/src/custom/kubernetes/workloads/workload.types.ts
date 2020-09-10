import { Injectable } from '@angular/core';

import { KubeAPIResource, KubernetesPod, KubeService, KubeStatus } from '../store/kube.types';

export interface HelmRelease {
  endpointId: string;
  guid: string;
  name: string;
  namespace: string;
  version: string;
  status: string;
  lastDeployed: Date;
  firstDeployed: Date;
  info: {
    last_deployed: Date;
    first_deployed: Date;
    notes: string;
    status: string;
  };
  config: any;
  chart: {
    values: any;
    metadata: {
      name: string;
      version: string;
      icon?: string;
      description: string;
      sources: string[];
    };
  };
}

export interface HelmReleaseEntity {
  endpointId: string;
  releaseTitle: string;
}

export interface HelmReleasePod extends HelmReleaseEntity, KubernetesPod { }

export interface HelmReleaseService extends HelmReleaseEntity, KubeService { }

export interface HelmReleaseGraph extends HelmReleaseEntity {
  nodes: { [key: string]: HelmReleaseGraphNode };
  links: { [key: string]: HelmReleaseGraphLink };
}

export interface HelmReleaseGraphNode {
  id: string;
  label: string;
  data: HelmReleaseGraphNodeData
}

export interface HelmReleaseGraphNodeData {
  kind: string,
  status: string,
  metadata: {
    name: string,
    namespace: string
  }
}

export interface HelmReleaseGraphLink {
  id: string;
  label?: string;
  source: string;
  target: string;
}

export interface HelmReleaseResources extends HelmReleaseEntity {
  data: HelmReleaseResource[],
  kind: string
};

export interface HelmReleaseRevision {
  first_deployed: string;
  last_deployed: string;
  deleted: boolean;
  description: string;
  status: string;
  revision: number;
}

export interface HelmReleaseHistory extends HelmReleaseEntity {
  revisions: HelmReleaseRevision[],
};

export interface HelmReleaseKubeAPIResource extends KubeAPIResource {
  apiVersion: string;
  kind: string;
}

export type HelmReleaseResource = HelmReleaseKubeAPIResource | KubeStatus;

@Injectable()
export class HelmReleaseGuid {
  guid: string;
}

export interface HelmReleaseChartData {
  podsChartData: { name: string; value: any; }[];
  containersChartData: { name: string; value: any; }[];
}
