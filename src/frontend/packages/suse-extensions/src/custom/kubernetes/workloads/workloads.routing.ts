import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import { HelmReleasePodsTabComponent } from './release/tabs/helm-release-pods/helm-release-pods-tab.component';
import {
  HelmReleaseResourceGraphComponent,
} from './release/tabs/helm-release-resource-graph/helm-release-resource-graph.component';
import { HelmReleaseServicesTabComponent } from './release/tabs/helm-release-services/helm-release-services-tab.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseValuesTabComponent } from './release/tabs/helm-release-values-tab/helm-release-values-tab.component';
import { HelmReleasesTabComponent } from './releases-tab/releases-tab.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: HelmReleasesTabComponent,
        pathMatch: 'full',
      },
      {
        // Helm Release Views
        path: ':guid',
        component: HelmReleaseTabBaseComponent,
        data: {
          reuseRoute: HelmReleaseTabBaseComponent,
        },
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: HelmReleaseSummaryTabComponent },
          { path: 'notes', component: HelmReleaseNotesTabComponent },
          { path: 'values', component: HelmReleaseValuesTabComponent },
          { path: 'pods', component: HelmReleasePodsTabComponent },
          { path: 'services', component: HelmReleaseServicesTabComponent },
          { path: 'graph', component: HelmReleaseResourceGraphComponent }
        ]
      },
    ]
  },
];

@NgModule({
  imports: [
    NgxChartsModule,
    RouterModule.forChild(routes)
  ]
})
export class WorkloadsRouting { }
