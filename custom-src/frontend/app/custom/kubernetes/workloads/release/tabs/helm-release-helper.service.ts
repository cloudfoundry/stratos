import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'frontend/packages/store/src/app-state';
import { entityCatalog } from 'frontend/packages/store/src/entity-catalog/entity-catalog';
import { EntityServiceFactory } from 'frontend/packages/store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from 'frontend/packages/store/src/monitors/pagination-monitor.factory';
import { selectEntity } from 'frontend/packages/store/src/selectors/api.selectors';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { KubernetesPod } from '../../../store/kube.types';
import {
  GetHelmRelease,
  GetHelmReleaseGraph,
  GetHelmReleasePods,
  GetHelmReleaseResource,
} from '../../store/workloads.actions';
import {
  HelmRelease,
  HelmReleaseChartData,
  HelmReleaseGraph,
  HelmReleaseGuid,
  HelmReleaseResource,
} from '../../workload.types';


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
    private store: Store<AppState>,
    private esf: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.guid = helmReleaseGuid.guid;
    this.releaseTitle = this.guid.split(':')[2];
    this.namespace = this.guid.split(':')[1];
    this.endpointGuid = this.guid.split(':')[0];

    const action = new GetHelmRelease(this.endpointGuid, this.namespace, this.releaseTitle);
    const entityService = this.esf.create<HelmRelease>(action.guid, action);

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
    const action = new GetHelmReleaseGraph(this.endpointGuid, this.releaseTitle);
    const entityKey = entityCatalog.getEntityKey(action);
    return this.store.select(selectEntity<HelmReleaseGraph>(entityKey, action.guid)).pipe(
      filter(graph => !!graph)
    );
  }

  public fetchReleaseResources(): Observable<HelmReleaseResource> {
    // Get helm release
    const action = new GetHelmReleaseResource(this.endpointGuid, this.releaseTitle);
    const entityKey = entityCatalog.getEntityKey(action);
    return this.store.select(selectEntity<HelmReleaseResource>(entityKey, action.guid)).pipe(
      filter(resources => !!resources)
    );
  }

  public fetchReleaseChartStats(): Observable<HelmReleaseChartData> {
    const action = new GetHelmReleasePods(this.endpointGuid, this.releaseTitle);
    return this.paginationMonitorFactory.create(
      action.paginationKey,
      action.entity[0],
      true
    ).currentPage$.pipe(
      filter(pods => !!pods),
      map(this.mapPods)
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
          if (containerStatus.state.running) {
            containers.ready.value++;
          } else {
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
}
