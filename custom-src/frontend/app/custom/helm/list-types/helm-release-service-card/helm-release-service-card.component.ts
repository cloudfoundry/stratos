import { Component, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CardCell } from '../../../../shared/components/list/list.types';
import { PaginationMonitor } from '../../../../shared/monitors/pagination-monitor';
import { KubeService } from '../../../kubernetes/store/kube.types';
import { GetKubernetesServicesInNamespace } from '../../../kubernetes/store/kubernetes.actions';
import { GetHelmReleases } from '../../store/helm.actions';
import { helmReleasesSchemaKey } from '../../store/helm.entities';
import { HelmRelease, HelmReleaseService } from '../../store/helm.types';

@Component({
  selector: 'app-release-service-card',
  templateUrl: './helm-release-service-card.component.html',
  styleUrls: ['./helm-release-service-card.component.scss']
})
export class HelmReleaseServiceCardComponent extends CardCell<HelmReleaseService> implements OnDestroy {

  private pRow: HelmReleaseService;
  private svcSub: Subscription;
  @Input() set row(row: HelmReleaseService) {
    this.pRow = row;
    if (!this.svcSub && row) {
      this.svcSub = this.fetchRelease(row.endpointGuid, row.releaseTitle).pipe(
        switchMap(release => {
          const action = new GetKubernetesServicesInNamespace(row.endpointGuid, release.namespace);
          const paginationMonitor = new PaginationMonitor<KubeService>(this.store, action.paginationKey, entityFactory(action.entityKey));
          return getPaginationObservables<KubeService>({ store: this.store, action, paginationMonitor }).entities$;
        }),
        filter(entities => !!entities),
        map(services => services.find(service => service.metadata.name === row.name))
      ).subscribe(service => {
        console.log('SERVICE: ', service);
      });
    }


  }
  get row() {
    return this.pRow;
  }


  constructor(
    private store: Store<AppState>,
    private esf: EntityServiceFactory
  ) {
    super();
  }

  ngOnDestroy() {
    if (this.svcSub) {
      this.svcSub.unsubscribe();
    }
  }

  private fetchRelease(endpointGuid: string, releaseTitle: string) {
    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(this.store, action.paginationKey, entityFactory(helmReleasesSchemaKey));
    const svc = getPaginationObservables({ store: this.store, action, paginationMonitor });


    return svc.entities$.pipe(
      map((items: HelmRelease[]) => items.find(item => item.guid === `${endpointGuid}:${releaseTitle}`))
    );
  }

}
