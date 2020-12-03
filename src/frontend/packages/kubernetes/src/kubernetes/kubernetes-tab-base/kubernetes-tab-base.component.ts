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
import { KubeResourceEntityDefinition } from '../store/kube.types';
import { kubeEntityCatalog } from './../kubernetes-entity-catalog';

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
    private route: ActivatedRoute,
  ) {
    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'kubernetes', iconFont: 'stratos-icons' },
      { link: 'analysis', label: 'Analysis', icon: 'assignment', hidden$: this.analysisService.hideAnalysis$ },
      { link: '-', label: 'Cluster' },
      { link: 'nodes', label: 'Nodes', icon: 'node', iconFont: 'stratos-icons' },
      { link: 'resource/namespace', label: 'Namespaces', icon: 'namespace', iconFont: 'stratos-icons' },
      ...this.getTabsFromEntityConfig(false),
      { link: '-', label: 'Resources' },
      ...this.getTabsFromEntityConfig(true)
    ];
  }


  private getTabsFromEntityConfig(namespaced: boolean = true) {
    const entityNames = Object.getOwnPropertyNames(kubeEntityCatalog);
    const tabsFromRouterConfig = [];

    // Get the tabs from the router configuration
    entityNames.forEach(key => {
      // See if we can find an entity for the key
      const catalogEntity = kubeEntityCatalog[key];
      if (catalogEntity) {
        const defn = catalogEntity.definition as KubeResourceEntityDefinition;
        if (defn.apiNamespaced === namespaced && !defn.hidden) {
          tabsFromRouterConfig.push({
            link: defn.route || `resource/${key}`,
            label: defn.labelTab || defn.labelPlural,
            icon: defn.icon,
            iconFont: defn.iconFont,
          });
        }
      }
    });

    tabsFromRouterConfig.sort((a, b) => a.label.localeCompare(b.label));
    return tabsFromRouterConfig;
  }

  private getTabsFromRouterConfig(namespaced: boolean = true) {
    const childRoutes = this.route.snapshot.routeConfig.children;
    const tabsFromRouterConfig = [];

    // Get the tabs from the router configuration
    childRoutes.forEach( r => {
      if (r.path.length > 0) {
        // See if we can find an entity for the key
        const key = r.data ? (r.data.entityCatalogKey ? r.data.entityCatalogKey : r.path) : r.path;
        const catalogEntity = kubeEntityCatalog[key];
        if (catalogEntity) {
          const defn = catalogEntity.definition as KubeResourceEntityDefinition;
          if (defn.apiNamespaced === namespaced) {
            tabsFromRouterConfig.push({
              link: defn.route ? defn.route : `resource/${r.path}`,
              label: defn.labelTab || defn.labelPlural,
              icon: defn.icon,
              iconFont: defn.iconFont,
            });
          }
        }
      }
    });

    tabsFromRouterConfig.sort((a, b) => a.label.localeCompare(b.label));
    return tabsFromRouterConfig;
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
