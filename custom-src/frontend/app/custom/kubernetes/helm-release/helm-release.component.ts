import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { Component, OnInit } from '@angular/core';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { Observable, of as ObservableOf } from 'rxjs';
import { HelmReleaseService } from '../services/helm-release.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-helm-release',
  templateUrl: './helm-release.component.html',
  styleUrls: ['./helm-release.component.scss'],
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
    HelmReleaseService,
    KubernetesEndpointService
  ]
})
export class HelmReleaseComponent implements OnInit {

  public tabLinks = [
    { link: 'pods', label: 'Pods', icon: 'adjust' },
    { link: 'services', label: 'Services', icon: 'service', iconFont: 'stratos-icons' },
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  isFetching$: Observable<boolean>;
  constructor(public kubeEndpointService: KubernetesEndpointService, public helmReleaseService: HelmReleaseService) {
    this.breadcrumbs$ = kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [
          { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}/apps` },
        ]
      }])
      )
    );
  }


  ngOnInit() {
    this.isFetching$ = ObservableOf(false);
  }

}
