import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '@stratosui/core';
import { SharedModule } from '@stratosui/core';
import { MonocularChartViewComponent } from './chart-view/monocular.component';
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
        MonocularModule
    ],
    declarations: [
        MonocularTabBaseComponent,
        CatalogTabComponent,
        MonocularChartCardComponent,
        MonocularChartViewComponent,
    ],
    providers: []
})
export class HelmModule { }

