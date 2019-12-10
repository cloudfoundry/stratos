import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseComponent } from './create-release/create-release.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import { HelmReleasePodsTabComponent } from './release/tabs/helm-release-pods/helm-release-pods-tab.component';
import { HelmReleaseServicesTabComponent } from './release/tabs/helm-release-services/helm-release-services-tab.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseValuesTabComponent } from './release/tabs/helm-release-values-tab/helm-release-values-tab.component';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';
import { HelmReleasesTabComponent } from './tabs/releases-tab/releases-tab.component';
import { RepositoryTabComponent } from './tabs/repository-tab/repository-tab.component';
import { HelmReleaseResourceGraphComponent } from './release/tabs/helm-release-resource-graph/helm-release-resource-graph.component';

const monocular: Routes = [
  {
    path: '',
    component: MonocularTabBaseComponent,
    children: [
      { path: '', redirectTo: 'charts', pathMatch: 'full' },
      { path: 'charts', component: CatalogTabComponent },
      { path: 'charts/:repo', component: CatalogTabComponent },
      { path: 'repos', component: RepositoryTabComponent },
      { path: 'repos/:guid', component: RepositoryTabComponent },
      { path: 'releases', component: HelmReleasesTabComponent },
    ]
  },
  {
    // Helm Release Views
    path: 'releases/:guid',
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
  { pathMatch: 'full', path: 'charts/:repo/:chartName/:version', component: MonocularChartViewComponent },
  { path: 'charts/:repo/:chartName', component: MonocularChartViewComponent },
  { pathMatch: 'full', path: 'install/:repo/:chartName/:version', component: CreateReleaseComponent },
  { pathMatch: 'full', path: 'install/:repo/:chartName', component: CreateReleaseComponent },
];

@NgModule({
  imports: [RouterModule.forChild(monocular)]
})
export class HelmRoutingModule { }
