import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { KubeService } from '../../kubernetes/store/kube.types';
import { GetKubernetesServicesInNamespace } from '../../kubernetes/store/kubernetes.actions';
import { GetHelmReleases, GetHelmReleaseServices } from '../store/helm.actions';
import { helmReleasesSchemaKey } from '../store/helm.entities';
import { HelmRelease, HelmReleaseService } from '../store/helm.types';

export const fetchHelmReleaseServiceFromKubernetes = (store: Store<AppState>, helmService: HelmReleaseService): Observable<KubeService> => {
  return fetchRelease(store, helmService.endpointId, helmService.releaseTitle).pipe(
    switchMap(release => {
      const action = new GetKubernetesServicesInNamespace(helmService.endpointId, release.namespace);
      const paginationMonitor = new PaginationMonitor<KubeService>(store, action.paginationKey, entityFactory(action.entityKey));
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
  const paginationMonitor = new PaginationMonitor(store, action.paginationKey, entityFactory(helmReleasesSchemaKey));
  const svc = getPaginationObservables({ store, action, paginationMonitor });
  return svc.entities$.pipe(
    map((items: HelmRelease[]) => items.find(item => item.guid === `${endpointGuid}:${releaseTitle}`))
  );
}

export class HelmReleaseServicesDataSource extends ListDataSource<HelmReleaseService> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmReleaseService>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleaseServices(endpointGuid, releaseTitle);
    super({
      store,
      action,
      schema: entityFactory(action.entityKey),
      getRowUniqueId: (object: HelmReleaseService) => object.name,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntity: map((helmServices: HelmReleaseService[]) => {
        return helmServices.map(helmService => {
          if (!helmService.kubeService$) {
            helmService.kubeService$ = fetchHelmReleaseServiceFromKubernetes(store, helmService);
          }
          return helmService;
        });
      })
    });
  }
}
