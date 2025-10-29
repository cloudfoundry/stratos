import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { PageHeaderComponent } from '@stratosui/core';
import { LoadingPageComponent } from '@stratosui/core';
import { StratosBaseCatalogEntity } from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { UserFavoriteEndpoint } from '../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../store/src/user-favorite-manager';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../services/kubernetes.analysis.service';
import { KubernetesService } from '../services/kubernetes.service';
import { KubeResourceEntityDefinition } from '../store/kube.types';
import { kubeEntityCatalog } from './../kubernetes-entity-generator';

@Component({
  selector: 'app-kubernetes-tab-base',
  templateUrl: './kubernetes-tab-base.component.html',
  styleUrls: ['./kubernetes-tab-base.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PageHeaderComponent,
    LoadingPageComponent,
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
    KubernetesAnalysisService,
  ]
})
export class KubernetesTabBaseComponent implements OnInit {

  tabLinks: Array<{ link: string; label: string; icon?: string; iconFont?: string; hidden$?: Observable<boolean> }> = [];

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
      ...this.getTabsFromEntityConfig(false),
      { link: '-', label: 'Resources' },
      ...this.getTabsFromEntityConfig(true)
    ];
  }


  private getTabsFromEntityConfig(namespaced: boolean = true): Array<{ link: string; label: string; icon?: string; iconFont?: string }> {
    const tabsFromRouterConfig: Array<{ link: string; label: string; icon?: string; iconFont?: string }> = [];

    // Get the tabs from the router configuration
    kubeEntityCatalog.allKubeEntities().forEach((catalogEntity: StratosBaseCatalogEntity) => {
      if (catalogEntity) {
        const defn = catalogEntity.definition as unknown as KubeResourceEntityDefinition;
        if (defn.apiNamespaced === namespaced && !defn.hidden) {
          tabsFromRouterConfig.push({
            link: `resource/${catalogEntity.type}`,
            label: defn.labelTab || defn.labelPlural,
            icon: defn.icon,
            iconFont: defn.iconFont,
          });
        }
      }
    });

    tabsFromRouterConfig.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
    return tabsFromRouterConfig;
  }

  ngOnInit() {
    this.isFetching$ = this.kubeEndpointService.endpoint$.pipe(
      map((endpoint: any) => !endpoint),
      startWith(true)
    );
    this.favorite$ = this.kubeEndpointService.endpoint$.pipe(
      first(),
      map((endpoint: any) => this.userFavoriteManager.getFavoriteEndpointFromEntity(endpoint.entity))
    );
    this.endpointIds$ = this.kubeEndpointService.endpoint$.pipe(
      map((endpoint: any) => [endpoint.entity.guid])
    );
  }
}
