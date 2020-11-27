import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule, SharedModule } from '../../../../core/src/public-api';
import { ChartDetailsInfoComponent } from './chart-details/chart-details-info/chart-details-info.component';
import { ChartDetailsReadmeComponent } from './chart-details/chart-details-readme/chart-details-readme.component';
import { ChartDetailsUsageComponent } from './chart-details/chart-details-usage/chart-details-usage.component';
import { ChartDetailsVersionsComponent } from './chart-details/chart-details-versions/chart-details-versions.component';
import { ChartDetailsComponent } from './chart-details/chart-details.component';
import { ChartIndexComponent } from './chart-index/chart-index.component';
import { ChartItemComponent } from './chart-item/chart-item.component';
import { ChartListComponent } from './chart-list/chart-list.component';
import { ChartsComponent } from './charts/charts.component';
import { ListFiltersComponent } from './list-filters/list-filters.component';
import { ListItemComponent } from './list-item/list-item.component';
import { LoaderComponent } from './loader/loader.component';
import { PanelComponent } from './panel/panel.component';
import { createMonocularProviders } from './stratos-monocular-providers.helpers';

const components = [
  PanelComponent,
  ChartListComponent,
  ChartItemComponent,
  ListItemComponent,
  ListFiltersComponent,
  LoaderComponent,
  ChartsComponent,
  ChartIndexComponent,
  ChartDetailsComponent,
  ChartDetailsUsageComponent,
  ChartDetailsVersionsComponent,
  ChartDetailsReadmeComponent,
  ChartDetailsInfoComponent,
];

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
  ],
  declarations: [
    ...components,
  ],
  providers: [
    // Note - not really needed here, given need to bring in with a component where route with endpoint id param exists
    ...createMonocularProviders()
  ],
  exports: [
    ...components
  ]
})
export class MonocularModule { }
