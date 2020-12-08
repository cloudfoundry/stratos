import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IPageSideNavTab } from '../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { SessionService } from '../../../../../../core/src/shared/services/session.service';
import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { kubeEntityCatalog } from '../../../kubernetes-entity-generator';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { KubeResourceEntityDefinition } from '../../../store/kube.types';
import { HelmReleaseGuid } from '../../workload.types';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';
import { HelmReleaseSocketService } from './helm-release-socket-service';


@Component({
  selector: 'app-helm-release-tab-base',
  templateUrl: './helm-release-tab-base.component.html',
  styleUrls: ['./helm-release-tab-base.component.scss'],
  providers: [
    HelmReleaseHelperService,
    KubernetesAnalysisService,
    {
      provide: HelmReleaseGuid,
      useFactory: (activatedRoute: ActivatedRoute) => ({
        guid: activatedRoute.snapshot.params.guid
      }),
      deps: [
        ActivatedRoute
      ]
    },
    HelmReleaseSocketService
  ]
})
export class HelmReleaseTabBaseComponent implements OnDestroy {

  isFetching$: Observable<boolean>;

  public breadcrumbs = [{
    breadcrumbs: [
      { value: 'Workloads', routerLink: '/workloads' }
    ]
  }];

  public title = '';

  tabLinks: IPageSideNavTab[];

  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private analysisService: KubernetesAnalysisService,
    private snackbarService: SnackBarService,
    sessionService: SessionService,
    private socketService: HelmReleaseSocketService
  ) {
    this.title = this.helmReleaseHelper.releaseTitle;

    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'helm', iconFont: 'stratos-icons' },
      { link: 'notes', label: 'Notes', icon: 'subject' },
      { link: 'values', label: 'Values', icon: 'list' },
      { link: 'history', label: 'History', icon: 'schedule' },
      { link: 'analysis', label: 'Analysis', icon: 'assignment', hidden$: this.analysisService.hideAnalysis$ },
      { link: '-', label: 'Resources' },
      { link: 'graph', label: 'Overview', icon: 'share', hidden$: sessionService.isTechPreview().pipe(map(tp => !tp)) },
      ...this.getTabsFromEntityConfig()
    ];

    this.socketService.start();
  }

  ngOnDestroy() {
    this.socketService.stop();
    this.snackbarService.hide();
  }

  private getTabsFromEntityConfig(): IPageSideNavTab[] {
    const tabsFromRouterConfig = [];

    // Get the tabs from the router configuration
    kubeEntityCatalog.allKubeEntities().forEach(catalogEntity => {
      if (catalogEntity) {
        const defn = catalogEntity.definition as unknown as KubeResourceEntityDefinition;
        if (defn.apiWorkspaced && !defn.hidden) {
          tabsFromRouterConfig.push({
            link: `resource/${catalogEntity.type}`,
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
}
