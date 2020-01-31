import { Store } from '@ngrx/store';
import { ListDataSource } from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';
import { PaginationMonitor } from 'frontend/packages/store/src/monitors/pagination-monitor';
import { getPaginationObservables } from 'frontend/packages/store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { kubernetesEntityFactory } from '../../kubernetes-entity-factory';
import { KubeService } from '../../store/kube.types';
import { GetKubernetesServicesInNamespace } from '../../store/kubernetes.actions';
import { getHelmReleaseServiceId } from '../store/workloads-entity-factory';
import { GetHelmReleases, GetHelmReleaseServices } from '../store/workloads.actions';
import { HelmRelease, HelmReleaseService } from '../workload.types';


export const fetchHelmReleaseServiceFromKubernetes = (store: Store<AppState>, helmService: HelmReleaseService): Observable<KubeService> => {
  return fetchRelease(store, helmService.endpointId, helmService.releaseTitle).pipe(
    switchMap(release => {
      const action = new GetKubernetesServicesInNamespace(helmService.endpointId, release.namespace);
      const paginationMonitor = new PaginationMonitor<KubeService>(store, action.paginationKey, kubernetesEntityFactory(action.entityType));
      return getPaginationObservables<KubeService>({ store, action, paginationMonitor }).entities$;
    }),
    filter(entities => !!entities),
    map(services => services.find(service => service.metadata.name === helmService.name)),
    publishReplay(1),
    refCount()
  );
};

function fetchRelease(store: Store<AppState>, endpointGuid: string, releaseTitle: string) {
  const action = new GetHelmReleases();
  const paginationMonitor = new PaginationMonitor(store, action.paginationKey, action);
  const svc = getPaginationObservables({ store, action, paginationMonitor });
  return svc.entities$.pipe(
    map((items: HelmRelease[]) => items.find(item => item.guid === `${endpointGuid}:${releaseTitle}`))
  );
}

export class HelmReleaseServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubeService>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleaseServices(endpointGuid, releaseTitle);
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: getHelmReleaseServiceId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
    //   transformEntity: map((helmServices: HelmReleaseService[]) => {
    //     return helmServices.map(helmService => {
    //       if (!helmService.kubeService$) {
    //         helmService.kubeService$ = fetchHelmReleaseServiceFromKubernetes(store, helmService);
    //       }
    //       return helmService;
    //     });
    //   }),
    //   refresh: () => {
    //     store.dispatch(action);
    //     store.dispatch(new ClearPaginationOfType(action));
    //   }
    // });
  }
}
