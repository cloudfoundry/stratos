import { Component, OnInit, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of as ObservableOf } from 'rxjs';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesService } from '../services/kubernetes.service';
import { first, map } from 'rxjs/operators';
import { UserFavoriteEndpoint } from '../../../../../store/src/types/user-favorites.types';

@Component({
  selector: 'app-kubernetes-tab-base',
  templateUrl: './kubernetes-tab-base.component.html',
  styleUrls: ['./kubernetes-tab-base.component.scss'],
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
  ]
})
export class KubernetesTabBaseComponent implements OnInit {

  tabLinks = [
    { link: 'summary', label: 'Summary', icon: 'kubernetes', iconFont: 'stratos-icons' },
    { link: 'nodes', label: 'Nodes', icon: 'developer_board' },
    { link: 'namespaces', label: 'Namespaces', icon: 'language' },
    { link: 'pods', label: 'Pods', icon: 'adjust' },
    { link: 'apps', label: 'Applications', icon: 'apps' }
  ];

  isFetching$: Observable<boolean>;
  public favorite$: Observable<UserFavoriteEndpoint>;

  constructor(public kubeEndpointService: KubernetesEndpointService) { }

  ngOnInit() {
    this.isFetching$ = ObservableOf(false);
    this.favorite$ = this.kubeEndpointService.endpoint$.pipe(
      first(),
      map(endpoint => new UserFavoriteEndpoint(
        endpoint.entity
      ))
    );
  }

}
