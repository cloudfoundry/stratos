import { Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { releaseTitle } from '../route-titles';

import { CreateReleaseComponent } from './create-release/create-release.component';
import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import {
  HelmReleaseAnalysisTabComponent,
} from './release/tabs/helm-release-analysis-tab/helm-release-analysis-tab.component';
import { HelmReleaseHistoryTabComponent } from './release/tabs/helm-release-history-tab/helm-release-history-tab.component';
import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import {
  HelmReleaseResourceGraphComponent,
} from './release/tabs/helm-release-resource-graph/helm-release-resource-graph.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseValuesTabComponent } from './release/tabs/helm-release-values-tab/helm-release-values-tab.component';
import { HelmReleasesTabComponent } from './releases-tab/releases-tab.component';
import { UpgradeReleaseComponent } from './upgrade-release/upgrade-release.component';

export const WORKLOADS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: HelmReleasesTabComponent,
        pathMatch: 'full',
      },
      { pathMatch: 'full', path: 'install/:endpoint/:repo/:name/:version', title: 'Install Chart', component: CreateReleaseComponent },
      { pathMatch: 'full', path: 'install/:endpoint/:repo/:name', title: 'Install Chart', component: CreateReleaseComponent },
      {
        // guid = kube endpoint
        path: ':guid/upgrade',
        title: 'Upgrade Workload',
        component: UpgradeReleaseComponent,
        pathMatch: 'full',
      },
      {
        // Helm Release Views
        path: ':guid',
        title: releaseTitle,
        component: HelmReleaseTabBaseComponent,
        data: {
          reuseRoute: HelmReleaseTabBaseComponent,
        },
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', title: tabTitle('Summary'), component: HelmReleaseSummaryTabComponent },
          { path: 'notes', title: tabTitle('Notes'), component: HelmReleaseNotesTabComponent },
          { path: 'values', title: tabTitle('Values'), component: HelmReleaseValuesTabComponent },
          { path: 'history', title: tabTitle('History'), component: HelmReleaseHistoryTabComponent },
          { path: 'graph', title: tabTitle('Overview'), component: HelmReleaseResourceGraphComponent },
          { path: 'analysis', title: tabTitle('Analysis'), component: HelmReleaseAnalysisTabComponent },
          {
            path: 'resource/:resource',
            loadChildren: () => import('../kubernetes-resource/generic-resource.routes').then(m => m.GENERIC_RESOURCE_ROUTES),
            data: {
              isWorkload: true
            }
          },
        ]
      },
    ]
  },
];
