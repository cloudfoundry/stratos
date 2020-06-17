import { Injectable } from '@angular/core';

import { KubernetesPod, KubeService } from '../store/kube.types';

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
      icon?: string;
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
  nodes: {};
  links: {};
}

export type HelmReleaseResource = any;

@Injectable()
export class HelmReleaseGuid {
  guid: string;
}

export interface HelmReleaseChartData {
  podsChartData: { name: string; value: any; }[];
  containersChartData: { name: string; value: any; }[];
}
