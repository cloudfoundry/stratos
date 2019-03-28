import { SharedModule } from '../../shared/shared.module';
import { HelmRoutingModule } from './helm.routing';
import { CoreModule } from '../../core/core.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ChartsComponent } from './monocular/charts/charts.component';
import { LoaderComponent } from './monocular/loader/loader.component';
import { ListItemComponent } from './monocular/list-item/list-item.component';
import { ListFiltersComponent } from './monocular/list-filters/list-filters.component';
import { ChartIndexComponent } from './monocular/chart-index/chart-index.component';
import { ChartListComponent } from './monocular/chart-list/chart-list.component';
import { ChartItemComponent } from './monocular/chart-item/chart-item.component';
import { AuthService } from './monocular/shared/services/auth.service';
import { ConfigService } from './monocular/shared/services/config.service';
import { ChartsService } from './monocular/shared/services/charts.service';
import { PanelComponent } from './monocular/panel/panel.component';
import { MenuService } from './monocular/shared/services/menu.service';
import { ReposService } from './monocular/shared/services/repos.service';
import { ChartDetailsComponent } from './monocular/chart-details/chart-details.component';
import { ChartDetailsUsageComponent } from './monocular/chart-details/chart-details-usage/chart-details-usage.component';
import { ChartDetailsVersionsComponent } from './monocular/chart-details/chart-details-versions/chart-details-versions.component';
import { ChartDetailsReadmeComponent } from './monocular/chart-details/chart-details-readme/chart-details-readme.component';
import { ChartDetailsInfoComponent } from './monocular/chart-details/chart-details-info/chart-details-info.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { RepositoryTabComponent } from './tabs/repository-tab/repository-tab.component';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';
import { MonocularChartCardComponent } from './list-types/monocular-chart-card/monocular-chart-card.component';
import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseModule } from './create-release/create-release.module';
import { HelmRepositoryCountComponent } from './list-types/helm-repository-count/helm-repository-count.component';
import { HelmConfigurationComponent } from './tabs/configuration-tab/helm-configuration.component';
import { HelmReleasesTabComponent } from './tabs/releases-tab/releases-tab.component';
import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseLinkComponent } from './list-types/helm-release-link/helm-release-link.component';
import { HelmReleaseEndpointLinkComponent } from './list-types/helm-release-endpoint-link/helm-release-endpoint-link.component';
import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import { HelmReleaseHelperService } from './release/tabs/helm-release-helper.service';

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
    HelmReleasesTabComponent,
    HelmConfigurationComponent,
    MonocularChartCardComponent,
    MonocularChartViewComponent,
    HelmRepositoryCountComponent,
    HelmReleaseTabBaseComponent,
    HelmReleaseSummaryTabComponent,
    HelmReleaseLinkComponent,
    HelmReleaseEndpointLinkComponent,
    HelmReleaseNotesTabComponent,
  ],
  providers: [
    ChartsService,
    ConfigService,
    MenuService,
    AuthService,
    ReposService,
  ],
  entryComponents: [
    MonocularChartCardComponent,
    HelmRepositoryCountComponent,
    HelmReleaseLinkComponent
  ]
})
export class HelmModule { }

