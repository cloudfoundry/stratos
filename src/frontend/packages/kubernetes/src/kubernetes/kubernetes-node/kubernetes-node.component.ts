import { AsyncPipe } from '@angular/common';
import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import type { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import type { IHeaderBreadcrumb } from '../../../../core/src/shared/components/page-header/page-header.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../services/kubernetes-node.service';
import { KubernetesService } from '../services/kubernetes.service';

@Component({
  selector: 'app-kubernetes-node',
  templateUrl: './kubernetes-node.component.html',
  styleUrls: ['./kubernetes-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    PageHeaderComponent,
  ],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.endpointId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    KubernetesEndpointService,
    KubernetesNodeService
  ]
})
export class KubernetesNodeComponent {

  tabLinks = [
    { link: 'summary', label: 'Summary', icon: 'kubernetes', iconFont: 'stratos-icons' },
    { link: 'metrics', label: 'Metrics', icon: 'equalizer' },
    { link: 'pods', label: 'Pods', icon: 'pod', iconFont: 'stratos-icons' },
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;  public kubeEndpointService = inject(KubernetesEndpointService);
  public kubeNodeService = inject(KubernetesNodeService);
  public endpointsService = inject(EndpointsService);



  constructor() {


    this.endpointsService.hasMetrics(this.kubeEndpointService.kubeGuid).pipe(
      first(),
      tap(haveMetrics => {
        if (!haveMetrics) {
          // Remove metrics tab
          this.tabLinks = this.tabLinks.filter(tab => tab.link !== 'metrics');
        }
      })
    ).subscribe();

    this.breadcrumbs$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [
          { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}` },
        ]
      }])
      )
    );


  }
}
