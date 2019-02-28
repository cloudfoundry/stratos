import { Component } from '@angular/core';
import { KubernetesService } from '../services/kubernetes.service';
import { Store } from '@ngrx/store';
import { map, filter, first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AppState } from '../../../../../store/src/app-state';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import {KubernetesEndpointsListConfigService} from '../list-types/kubernetes-endpoints/kubernetes-endpoints-list-config.service';

@Component({
  selector: 'app-kubernetes',
  templateUrl: './kubernetes.component.html',
  styleUrls: ['./kubernetes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: KubernetesEndpointsListConfigService,
    },
    KubernetesService
  ]
})
export class KubernetesComponent {

  connectedEndpoints$: Observable<number>;
  constructor(
    private store: Store<AppState>,
    private kubeService: KubernetesService
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
