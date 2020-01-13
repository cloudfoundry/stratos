import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseComponent } from './create-release/create-release.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';
import { RepositoryTabComponent } from './tabs/repository-tab/repository-tab.component';

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
