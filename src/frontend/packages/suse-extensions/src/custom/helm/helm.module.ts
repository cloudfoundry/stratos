import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseModule } from './create-release/create-release.module';
import { HelmRoutingModule } from './helm.routing';
import { MonocularChartCardComponent } from './list-types/monocular-chart-card/monocular-chart-card.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { ChartDetailsInfoComponent } from './monocular/chart-details/chart-details-info/chart-details-info.component';
import { ChartDetailsReadmeComponent } from './monocular/chart-details/chart-details-readme/chart-details-readme.component';
import { ChartDetailsUsageComponent } from './monocular/chart-details/chart-details-usage/chart-details-usage.component';
import {
  ChartDetailsVersionsComponent,
} from './monocular/chart-details/chart-details-versions/chart-details-versions.component';
import { ChartDetailsComponent } from './monocular/chart-details/chart-details.component';
import { ChartIndexComponent } from './monocular/chart-index/chart-index.component';
import { ChartItemComponent } from './monocular/chart-item/chart-item.component';
import { ChartListComponent } from './monocular/chart-list/chart-list.component';
import { ChartsComponent } from './monocular/charts/charts.component';
import { ListFiltersComponent } from './monocular/list-filters/list-filters.component';
import { ListItemComponent } from './monocular/list-item/list-item.component';
import { LoaderComponent } from './monocular/loader/loader.component';
import { PanelComponent } from './monocular/panel/panel.component';
import { ChartsService } from './monocular/shared/services/charts.service';
import { ConfigService } from './monocular/shared/services/config.service';
import { MenuService } from './monocular/shared/services/menu.service';
import { ReposService } from './monocular/shared/services/repos.service';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';
import { RepositoryTabComponent } from './tabs/repository-tab/repository-tab.component';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    HelmRoutingModule,
    CreateReleaseModule,
  ],
  declarations: [
    PanelComponent,
    ChartIndexComponent,
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
    MonocularTabBaseComponent,
    RepositoryTabComponent,
    CatalogTabComponent,
    MonocularChartCardComponent,
    MonocularChartViewComponent,
  ],
  providers: [
    ChartsService,
    ConfigService,
    MenuService,
    ReposService
  ],
  entryComponents: [
    MonocularChartCardComponent,
  ]
})
export class HelmModule { }

