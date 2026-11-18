import { Component, Signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { PageHeaderComponent } from '@stratosui/core';
import { LoadingPageComponent } from '@stratosui/core';
import { naturalCompare } from '@stratosui/core';
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

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
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
export class KubernetesTabBaseComponent {

  tabLinks: Array<{ link: string; label: string; icon?: string; iconFont?: string; isHidden?: Signal<boolean> }> = [];

  public kubeEndpointService = inject(KubernetesEndpointService);
  public userFavoriteManager = inject(UserFavoriteManager);
  public analysisService = inject(KubernetesAnalysisService);

  readonly isFetching = computed(() => !this.kubeEndpointService.endpoint());
  readonly favorite = computed((): UserFavoriteEndpoint | null => {
    const endpoint = this.kubeEndpointService.endpoint();
    return endpoint ? this.userFavoriteManager.getFavoriteEndpointFromEntity(endpoint) : null;
  });
  // The route's endpoint, for the page header's endpoint errors.
  readonly endpointIds: string[] = [this.kubeEndpointService.baseKube.guid];



  constructor() {


    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'kubernetes', iconFont: 'stratos-icons' },
      { link: 'analysis', label: 'Analysis', icon: 'assignment', isHidden: this.analysisService.hideAnalysis },
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
            label: defn.labelTab || defn.labelPlural || defn.label,
            icon: defn.icon,
            iconFont: defn.iconFont,
          });
        }
      }
    });

    tabsFromRouterConfig.sort((a: { label: string }, b: { label: string }) => naturalCompare(a.label, b.label));
    return tabsFromRouterConfig;
  }
}
