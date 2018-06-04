import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ServiceBaseComponent } from './service-base/service-base.component';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { ServiceCatalogRoutingModule } from './service-catalog.routing';
import { ServiceInstancesComponent } from './service-instances/service-instances.component';
import { CreateApplicationModule } from '../applications/create-application/create-application.module';
import { ServicePlansComponent } from './service-plans/service-plans.component';
import { ServiceTabsBaseComponent } from './service-tabs-base/service-tabs-base.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ServiceCatalogRoutingModule,
    CoreModule,
    CreateApplicationModule
  ],
  declarations: [
    ServiceCatalogPageComponent,
    ServiceBaseComponent,
    ServiceInstancesComponent,
    ServicePlansComponent,
    ServiceTabsBaseComponent,
  ],
  exports: [
    ServiceTabsBaseComponent,
  ],
})
export class ServiceCatalogModule { }
