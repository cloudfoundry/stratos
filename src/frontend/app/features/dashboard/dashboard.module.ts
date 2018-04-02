import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { DashboardBaseComponent } from './dashboard-base/dashboard-base.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { MetricsModule } from '../metrics/metrics.module';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MetricsModule,
  ],
  declarations: [
    SideNavComponent,
    DashboardBaseComponent
  ]
})
export class DashboardModule { }
