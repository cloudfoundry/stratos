import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { helmEntityCatalog } from '../../../../helm/helm-entity-catalog';
import { ChartAttributes } from '../../../../helm/monocular/shared/models/chart';
import { ChartMetadata } from '../../../../helm/store/helm.types';
import { kubeEntityCatalog } from '../../../kubernetes-entity-catalog';
import { ContainerStateCollection, KubernetesPod } from '../../../store/kube.types';
import { getHelmReleaseDetailsFromGuid } from '../../store/workloads-entity-factory';
import {
  HelmRelease,
  HelmReleaseChartData,
  HelmReleaseGraph,
  HelmReleaseGuid,
  HelmReleaseResources,
  HelmReleaseRevision,
} from '../../workload.types';
import { workloadsEntityCatalog } from '../../workloads-entity-catalog';

// Simple class to represent MAJOR.MINOR.REVISION version
export class Version {

  public major: number;
  public minor: number;
  public revision: number;

  public prerelease: string;

  public valid: boolean;

  constructor(v: string) {
    this.valid = false;
    if (typeof v === 'string') {
      let version = v;
      const pre = v.split('-');
      if (pre.length > 1) {
        version = pre[0];
        this.prerelease = pre[1];
      }
      const parts = version.split('.');
      if (parts.length === 3) {
        this.major = parseInt(parts[0], 10);
        this.minor = parseInt(parts[1], 10);
        this.revision = parseInt(parts[2], 10);
        this.valid = true;
      }
    }
  }

  // Is this version newer than the supplied other version?
  public isNewer(other: Version): boolean {
    if (!this.valid || !other.valid) {
      return false;
    }

    if (this.major > other.major) {
      return true;
    }

    if (this.major === other.major) {
      if (this.minor > other.minor) {
        return true;
      }
      if (this.minor === other.minor) {
        if (this.revision === other.revision) {
          // Same version numbers
          if (this.prerelease && !other.prerelease) {
            return false;
          }
          if(!this.prerelease && other.prerelease) {
            return true;
          }
          if (this.prerelease && other.prerelease) {
            return this.prerelease > other.prerelease;
          }
          return false;
        }
        return this.revision > other.revision;
      }
    }
    return false;
  }
}

type InternalHelmUpgrade = {
  release: HelmRelease,
  upgrade: ChartAttributes,
  version: string,
  monocularEndpointId: string;
};

@Injectable()
export class HelmReleaseHelperService {

  public isFetching$: Observable<boolean>;

  public release$: Observable<HelmRelease>;

  public guid: string;
  public endpointGuid: string;
  public namespace: string;
  public releaseTitle: string;

  constructor(
    helmReleaseGuid: HelmReleaseGuid,
  ) {
    this.guid = helmReleaseGuid.guid;
    const { endpointId, namespace, releaseTitle } = getHelmReleaseDetailsFromGuid(this.guid);
    this.releaseTitle = releaseTitle;
    this.namespace = namespace;
    this.endpointGuid = endpointId;

    const entityService = workloadsEntityCatalog.release.store.getEntityService(
      this.releaseTitle,
      this.endpointGuid,
      { namespace: this.namespace }
    );

    this.release$ = entityService.waitForEntity$.pipe(
      map((item) => item.entity),
      map((item: HelmRelease) => {
        if (!item.chart.metadata.icon) {
          const copy = JSON.parse(JSON.stringify(item));
          copy.chart.metadata.icon = '/core/assets/custom/app_placeholder.svg';
          return copy;
        }
        return item;
      })
    );

    this.isFetching$ = entityService.isFetchingEntity$;
  }

  public guidAsUrlFragment(): string {
    return this.guid.replace(':', '/').replace(':', '/');
  }

  public fetchReleaseGraph(): Observable<HelmReleaseGraph> {
    // Get helm release
    const guid = workloadsEntityCatalog.graph.actions.get(this.releaseTitle, this.endpointGuid).guid;
    return workloadsEntityCatalog.graph.store.getEntityMonitor(guid).entity$.pipe(
      filter(graph => !!graph)
    );
  }

  public fetchReleaseResources(): Observable<HelmReleaseResources> {
    // Get helm release
    const guid = workloadsEntityCatalog.resource.actions.get(this.releaseTitle, this.endpointGuid).guid;
    return workloadsEntityCatalog.resource.store.getEntityMonitor(guid).entity$.pipe(
      filter(resources => !!resources)
    );
  }

  public fetchReleaseChartStats(): Observable<HelmReleaseChartData> {
    return kubeEntityCatalog.pod.store.getInWorkload.getPaginationMonitor(
      this.endpointGuid,
      this.releaseTitle
    ).currentPage$.pipe(
      filter(pods => !!pods),
      map(pods => this.mapPods(pods))
    );
  }

  // Check to see if a workload has updates available
  public getCharts() {
    return helmEntityCatalog.chart.store.getPaginationService().entities$.pipe(
      filter(charts => !!charts)
    );
  }

  public fetchReleaseHistory(): Observable<HelmReleaseRevision[]> {
    // Get the history for a Helm release
    return workloadsEntityCatalog.history.store.getEntityService(
      this.releaseTitle,
      this.endpointGuid,
      { namespace: this.namespace }
    ).waitForEntity$.pipe(
      map(historyEntity => historyEntity.entity.revisions)
    );
  }

  private mapPods(pods: KubernetesPod[]): HelmReleaseChartData {
    const podPhases: { [phase: string]: number, } = {};
    const containers = {
      ready: {
        name: 'Ready',
        value: 0
      },
      notReady: {
        name: 'Not Ready',
        value: 0
      }
    };

    pods.forEach(pod => {
      const status = pod.expandedStatus.status;

      if (!podPhases[status]) {
        podPhases[status] = 1;
      } else {
        podPhases[status]++;
      }

      if (pod.status.containerStatuses) {
        pod.status.containerStatuses.forEach(containerStatus => {
          const isReady = this.isContainerReady(containerStatus.state);
          if (isReady === true) {
            containers.ready.value++;
          } else if (isReady === false) {
            containers.notReady.value++;
          }
        });
      }
    });

    return {
      podsChartData: Object.entries(podPhases).map(([phase, count]) => ({
        name: phase,
        value: count
      })),
      containersChartData: Object.values(containers)
    };
  }

  // tslint:disable-next-line:ban-types
  private isContainerReady(state: ContainerStateCollection = {}): Boolean {
    if (state.running) {
      return true;
    } else if (!!state.waiting) {
      return false;
    } else if (!!state.terminated) {
      // Assume a failed state is not ready (covers completed init states), discard success state
      return state.terminated.exitCode === 0 ? null : false;
    }
    return false;
  }

  public hasUpgrade(returnLatest = false): Observable<InternalHelmUpgrade> {
    const updates = combineLatest(this.getCharts(), this.release$);
    return updates.pipe(
      map(([charts, release]) => {
        let score = -1;
        let match;
        for (const c of charts) {
          const matchScore = this.compareCharts(c.attributes, release.chart.metadata);
          if (matchScore > score) {
            score = matchScore;
            if (c.relationships && c.relationships.latestChartVersion && c.relationships.latestChartVersion.data) {
              const latest = new Version(c.relationships.latestChartVersion.data.version);
              const current = new Version(release.chart.metadata.version);
              if (latest.isNewer(current)) {
                match = {
                  release,
                  upgrade: c.attributes,
                  version: c.relationships.latestChartVersion.data.version,
                  monocularEndpointId: c.monocularEndpointId
                };
              }
            }
          }
        }
        // Did we find a matching chart? If so, return it
        if (match) {
          return match;
        }
        // No newer release, so return the release itself if that is what was requested and we can find the chart
        // NOTE: If the helm repository is removed that we installed from, we won't be able to find the chart
        if (returnLatest) {
          // Need to check that the chart is probably the same
          const releaseChart = charts.find(c => this.compareCharts(c.attributes, release.chart.metadata) !== -1 &&
            c.relationships.latestChartVersion.data.version === release.chart.metadata.version);
          if (releaseChart) {
            return {
              release,
              upgrade: releaseChart.attributes,
              version: releaseChart.relationships.latestChartVersion.data.version,
              monocularEndpointId: releaseChart.monocularEndpointId
            };
          }
        }
        return null;
      })
    );
  }

  // We might have a chart with the same name in multiple repositories - we only have chart metadata
  // We don't know which Helm repository it came from, so use the name and sources to match
  // Also uses the common words in the description and returns a weight
  private compareCharts(a: ChartMetadata, b: ChartMetadata): number {
    // Basic properties must be the same
    if (a.name !== b.name) {
      return -1;
    }

    // Find common words in the descriptions
    const words = {};
    for (let w of a.description.split(' ')) {
      w = w.toLowerCase();
      if (w.length > 3 && w !== 'helm' && w !== 'chart') {
        words[w] = true
      }
    }

    let common = 0;
    for (let w of b.description.split(' ')) {
      w = w.toLowerCase();
      if(words[w]) {
        common++;
      }
    }

    if (!a.sources || !b.sources) {
      return common;
    }

    // Must have at least one source in common
    let count = 0;
    a.sources.forEach(source => {
      count += b.sources.findIndex((s) => s === source) === -1 ? 0 : 1;
    });

    return common + count * 100;
  }

}

