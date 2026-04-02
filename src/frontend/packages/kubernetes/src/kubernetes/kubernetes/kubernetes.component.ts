import { CommonModule } from '@angular/common';
import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { ListComponent } from '../../../../core/src/shared/components/list/list.component';
import { EndpointListHelper } from '../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { ListConfig } from '../../../../core/src/shared/components/list/list.component.types';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import { RouterNav } from '../../../../store/src/actions/router.actions';
import { AppState } from '../../../../store/src/public-api';
import {
  KubernetesEndpointsListConfigService } from '../list-types/kubernetes-endpoints/kubernetes-endpoints-list-config.service';
import { KubernetesService } from '../services/kubernetes.service';

@Component({
  selector: 'app-kubernetes',
  templateUrl: './kubernetes.component.html',
  styleUrls: ['./kubernetes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: KubernetesEndpointsListConfigService },
    EndpointListHelper,
    KubernetesService
  ],
  standalone: true,
  imports: [
    CommonModule,
    ListComponent,
    PageHeaderComponent
  ]
})
export class KubernetesComponent {

  connectedEndpoints$: Observable<number>;
  private store = inject(Store<AppState>);
  private kubeService = inject(KubernetesService);


  constructor() {

    this.connectedEndpoints$ = this.kubeService.kubeEndpoints$.pipe(
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
      take(1)
    );

  }
}
