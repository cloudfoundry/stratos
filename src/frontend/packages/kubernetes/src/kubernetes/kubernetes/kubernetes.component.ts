import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { SignalListComponent } from '@stratosui/core';

import { EndpointCardComponent } from '../../../../core/src/shared/components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import { EndpointListHelper } from '../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import {
  KubernetesEndpointsSignalConfigService,
} from '../list-types/kubernetes-endpoints/kubernetes-endpoints-signal-config.service';
import { KubernetesService } from '../services/kubernetes.service';

@Component({
  selector: 'app-kubernetes',
  templateUrl: './kubernetes.component.html',

  providers: [
    EndpointListHelper,
    KubernetesService,
  ],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SignalListComponent,
    EndpointCardComponent,
  ],
})
export class KubernetesComponent implements OnInit, OnDestroy {

  connectedEndpoints$: Observable<number>;
  private kubeService = inject(KubernetesService);
  private router = inject(Router);
  readonly endpointsSignalConfig = inject(KubernetesEndpointsSignalConfigService);


  constructor() {

    this.connectedEndpoints$ = this.kubeService.kubeEndpoints$.pipe(
      map(kubeEndpoints => {
        const connectedEndpoints = kubeEndpoints.filter(
          c => c.connectionStatus === 'connected'
        );
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          // Single connected endpoint → auto-navigate into its detail
          // page. Was previously a `RouterNav` ngrx action — flipped to
          // the Angular Router directly so this component sheds its
          // last @ngrx/store import alongside the list config migration.
          void this.router.navigate(['kubernetes', connectedEndpoints[0].guid]);
        }
        return connectedEndpoints.length;
      }),
      filter(connectedEndpointsCount => connectedEndpointsCount > 1),
      take(1)
    );

  }

  ngOnInit(): void {
    // Touch the lazily-built signal config so the underlying data source
    // wires up before the template binds. Without this, the @if-gated
    // <app-signal-list> doesn't create the config until the connected
    // endpoint count resolves, deferring the first render.
    void this.endpointsSignalConfig.config;
  }

  ngOnDestroy(): void {
    // Release the legacy data source's pagination subscription; the
    // signal-config is `providedIn: 'root'` so it would otherwise live
    // beyond the page navigation.
    this.endpointsSignalConfig.destroy();
  }
}
