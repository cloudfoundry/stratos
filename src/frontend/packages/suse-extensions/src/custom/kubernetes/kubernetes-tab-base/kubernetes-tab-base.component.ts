import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { FavoritesConfigMapper } from '../../../../../store/src/favorite-config-mapper';
import { UserFavoriteEndpoint } from '../../../../../store/src/types/user-favorites.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesService } from '../services/kubernetes.service';

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
  ];

  public isFetching$: Observable<boolean>;
  public favorite$: Observable<UserFavoriteEndpoint>;
  public endpointIds$: Observable<string[]>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public favoritesConfigMapper: FavoritesConfigMapper) { }

  ngOnInit() {
    this.isFetching$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => !endpoint),
      startWith(true)
    );
    this.favorite$ = this.kubeEndpointService.endpoint$.pipe(
      first(),
      map(endpoint => this.favoritesConfigMapper.getFavoriteEndpointFromEntity(endpoint.entity))
    );
    this.endpointIds$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => [endpoint.entity.guid])
    );
  }

}
