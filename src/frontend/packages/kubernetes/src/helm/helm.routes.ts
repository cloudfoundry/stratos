import { Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { chartTitle } from '../kubernetes/route-titles';

import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';

export const HELM_ROUTES: Routes = [
  {
    path: '',
    component: MonocularTabBaseComponent,
    children: [
      { path: '', redirectTo: 'charts', pathMatch: 'full' },
      { path: 'charts', title: tabTitle('Charts'), component: CatalogTabComponent },
      { path: 'charts/:repo', title: tabTitle('Charts'), component: CatalogTabComponent },
    ]
  },
  { pathMatch: 'full', path: 'charts/:endpoint/:repo/:chartName/:version', title: chartTitle, component: MonocularChartViewComponent },
  { path: 'charts/:endpoint/:repo/:chartName', title: chartTitle, component: MonocularChartViewComponent },
];
