import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { kubeEntityCatalog } from '../../../kubernetes-entity-catalog';
import { ContainerStateCollection, KubernetesPod } from '../../../store/kube.types';
import { getHelmReleaseDetailsFromGuid } from '../../store/workloads-entity-factory';
import {
  HelmRelease,
  HelmReleaseChartData,
  HelmReleaseGraph,
  HelmReleaseGuid,
  HelmReleaseResource,
} from '../../workload.types';
import { workloadsEntityCatalog } from '../../workloads-entity-catalog';


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

  public fetchReleaseResources(): Observable<HelmReleaseResource> {
    // Get helm release
    const action = workloadsEntityCatalog.resource.actions.get(this.releaseTitle, this.endpointGuid)
    return workloadsEntityCatalog.resource.store.getEntityMonitor(
      action.guid
    ).entity$.pipe(
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

  private mapPods(pods: KubernetesPod[]): HelmReleaseChartData {
    const podPhases: { [phase: string]: number } = {};
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

  private isContainerReady(state: ContainerStateCollection = {}): Boolean {
    if (state.running) {
      return true;
    } else if (!!state.waiting) {
      return false;
    } else if (!!state.terminated) {
      // Assume a failed state is not ready (covers completed init states), discard success state
      return state.terminated.exitCode === 0 ? null : false
    }
    return false;
  }
}
