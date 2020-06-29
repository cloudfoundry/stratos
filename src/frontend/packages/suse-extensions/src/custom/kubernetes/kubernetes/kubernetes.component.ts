import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import {
  EndpointListHelper,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../store/src/app-state';
import {
  KubernetesEndpointsListConfigService,
} from '../list-types/kubernetes-endpoints/kubernetes-endpoints-list-config.service';
import { KubernetesService } from '../services/kubernetes.service';

@Component({
  selector: 'app-kubernetes',
  templateUrl: './kubernetes.component.html',
  styleUrls: ['./kubernetes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: KubernetesEndpointsListConfigService,
    },
    EndpointListHelper,
    KubernetesService
  ]
})
export class KubernetesComponent {

  connectedEndpoints$: Observable<number>;
  constructor(
    private store: Store<AppState>,
    kubeService: KubernetesService
  ) {
    this.connectedEndpoints$ = kubeService.kubeEndpoints$.pipe(
      map(kubeEndpoints => {
        const connectedEndpoints = kubeEndpoints.filter(
          c => c.connectionStatus === 'connected'
        );
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          this.store.dispatch(new RouterNav({
            path: ['kubernetes', connectedEndpoints[0].guid]
          }));
        }
        return connectedEndpoints.length;
      }),
      filter(connectedEndpointsCount => connectedEndpointsCount > 1),
      first()
    );
  }
}
