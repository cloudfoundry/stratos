import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { CloudFoundrySharedModule } from '../../shared/cf-shared.module';
import { CreateApplicationModule } from '../applications/create-application/create-application.module';
import { ServiceBaseComponent } from './service-base/service-base.component';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { ServiceCatalogRoutingModule } from './service-catalog.routing';
import { ServiceInstancesComponent } from './service-instances/service-instances.component';
import { ServicePlansComponent } from './service-plans/service-plans.component';
import { ServiceSummaryComponent } from './service-summary/service-summary.component';
import { ServiceTabsBaseComponent } from './service-tabs-base/service-tabs-base.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ServiceCatalogRoutingModule,
    CoreModule,
    CreateApplicationModule,
    CloudFoundrySharedModule,
  ],
  declarations: [
    ServiceCatalogPageComponent,
    ServiceBaseComponent,
    ServiceInstancesComponent,
    ServicePlansComponent,
    ServiceTabsBaseComponent,
    ServiceSummaryComponent,

  ],
  exports: [
    ServiceTabsBaseComponent,
  ],
  providers: [
    DatePipe
  ]
})
export class ServiceCatalogModule { }
