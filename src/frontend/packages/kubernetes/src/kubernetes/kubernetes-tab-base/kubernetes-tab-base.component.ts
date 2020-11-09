import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { UserFavoriteEndpoint } from '../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../store/src/user-favorite-manager';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../services/kubernetes.analysis.service';
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
    KubernetesAnalysisService,
  ]
})
export class KubernetesTabBaseComponent implements OnInit {

  tabLinks = [];

  public isFetching$: Observable<boolean>;
  public favorite$: Observable<UserFavoriteEndpoint>;
  public endpointIds$: Observable<string[]>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public userFavoriteManager: UserFavoriteManager,
    public analysisService: KubernetesAnalysisService,
  ) {
    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'kubernetes', iconFont: 'stratos-icons' },
      { link: 'analysis', label: 'Analysis', icon: 'assignment', hidden$: this.analysisService.hideAnalysis$ },
      { link: '-', label: 'Cluster' },
      { link: 'nodes', label: 'Nodes', icon: 'node', iconFont: 'stratos-icons' },
      { link: 'namespaces', label: 'Namespaces', icon: 'namespace', iconFont: 'stratos-icons' },
      { link: '-', label: 'Resources' },
      { link: 'pods', label: 'Pods', icon: 'pod', iconFont: 'stratos-icons' },
    ];
  }

  ngOnInit() {
    this.isFetching$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => !endpoint),
      startWith(true)
    );
    this.favorite$ = this.kubeEndpointService.endpoint$.pipe(
      first(),
      map(endpoint => this.userFavoriteManager.getFavoriteEndpointFromEntity(endpoint.entity))
    );
    this.endpointIds$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => [endpoint.entity.guid])
    );
  }

}
