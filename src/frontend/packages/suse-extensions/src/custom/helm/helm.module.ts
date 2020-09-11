import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { MonocularChartViewComponent } from './chart-view/monocular.component';
import { CreateReleaseModule } from './create-release/create-release.module';
import { HelmRoutingModule } from './helm.routing';
import { MonocularChartCardComponent } from './list-types/monocular-chart-card/monocular-chart-card.component';
import { MonocularTabBaseComponent } from './monocular-tab-base/monocular-tab-base.component';
import { MonocularModule } from './monocular/monocular.module';
import { CatalogTabComponent } from './tabs/catalog-tab/catalog-tab.component';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    HelmRoutingModule,
    CreateReleaseModule,
    MonocularModule
  ],
  declarations: [
    MonocularTabBaseComponent,
    CatalogTabComponent,
    MonocularChartCardComponent,
    MonocularChartViewComponent,
  ],
  providers: [
  ],
  entryComponents: [
    MonocularChartCardComponent,
  ]
})
export class HelmModule { }

