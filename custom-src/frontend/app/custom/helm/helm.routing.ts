import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RepositoryTabComponent } from './tabs/repository-tab/repository-tab.component';
import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseComponent } from './create-release/create-release.component';
import { HelmConfigurationComponent } from './tabs/configuration-tab/helm-configuration.component';
import { HelmReleasesTabComponent } from './tabs/releases-tab/releases-tab.component';
import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseValuesTabComponent } from './release/tabs/helm-release-values-tab/helm-release-values-tab.component';

const monocular: Routes = [
  {
    path: '',
    component: MonocularTabBaseComponent,
    data: {
      uiFullView: true,
    },
    children: [
      { path: '', redirectTo: 'charts', pathMatch: 'full' },
      { path: 'charts', component: CatalogTabComponent },
      { path: 'charts/:repo', component: CatalogTabComponent },
      { path: 'repos', component: RepositoryTabComponent },
      { path: 'repos/:guid', component: RepositoryTabComponent },
      { path: 'config', component: HelmConfigurationComponent },
      { path: 'releases', component: HelmReleasesTabComponent },
    ]
  },
  {
    // Helm Release Views
    path: 'releases/:guid',
    component: HelmReleaseTabBaseComponent,
    data: {
      uiFullView: true,
    },
    children: [
      { path: '', redirectTo: 'summary', pathMatch: 'full' },
      { path: 'summary', component: HelmReleaseSummaryTabComponent },
      { path: 'notes', component: HelmReleaseNotesTabComponent },
      { path: 'values', component: HelmReleaseValuesTabComponent },
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
