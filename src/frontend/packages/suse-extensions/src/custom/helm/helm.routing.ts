import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseComponent } from './create-release/create-release.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';

const monocular: Routes = [
  {
    path: '',
    component: MonocularTabBaseComponent,
    children: [
      { path: '', redirectTo: 'charts', pathMatch: 'full' },
      { path: 'charts', component: CatalogTabComponent },
      { path: 'charts/:repo', component: CatalogTabComponent },
    ]
  },
  { pathMatch: 'full', path: 'charts/:endpoint/:repo/:chartName/:version', component: MonocularChartViewComponent },
  { path: 'charts/:endpoint/:repo/:chartName', component: MonocularChartViewComponent },
  { pathMatch: 'full', path: 'install/:endpoint/:repo/:chartName/:version', component: CreateReleaseComponent },
  { path: 'install/:endpoint/:repo/:chartName', component: CreateReleaseComponent },
];

@NgModule({
  imports: [RouterModule.forChild(monocular)]
})
export class HelmRoutingModule { }
