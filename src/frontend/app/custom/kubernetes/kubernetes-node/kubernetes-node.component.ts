import { Component, OnInit } from '@angular/core';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../services/kubernetes-node.service';
import { Observable } from 'rxjs';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-kubernetes-node',
  templateUrl: './kubernetes-node.component.html',
  styleUrls: ['./kubernetes-node.component.scss'],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.kubeId
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
export class KubernetesNodeComponent implements OnInit {

  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'metrics', label: 'Metrics' },
    { link: 'pods', label: 'Pods' },
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public kubeNodeService: KubernetesNodeService
  ) {
    this.breadcrumbs$ = kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [
          { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}` },
        ]
      }])
      )
    );
  }

  ngOnInit() {
  }

}
