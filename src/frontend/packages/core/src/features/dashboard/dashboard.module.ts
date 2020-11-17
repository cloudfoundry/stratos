import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { MetricsModule } from '../metrics/metrics.module';
import { DashboardBaseComponent } from './dashboard-base/dashboard-base.component';
import { PageSideNavComponent } from './page-side-nav/page-side-nav.component';
import { SideNavComponent } from './side-nav/side-nav.component';


@NgModule({
  imports: [
    CoreModule,
    ScrollingModule,
    SharedModule,
    MetricsModule,
  ],
  declarations: [
    SideNavComponent,
    DashboardBaseComponent,
    PageSideNavComponent
  ]
})
export class DashboardModule { }
