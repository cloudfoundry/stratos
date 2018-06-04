import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { CreateApplicationModule } from '../applications/create-application/create-application.module';
import { AddServiceInstanceComponent } from './add-service-instance/add-service-instance/add-service-instance.component';
import { BindAppsStepComponent } from './add-service-instance/bind-apps-step/bind-apps-step.component';
import { NoServicePlansComponent } from './add-service-instance/no-service-plans/no-service-plans.component';
import { SelectPlanStepComponent } from './add-service-instance/select-plan-step/select-plan-step.component';
import { SelectServiceComponent } from './add-service-instance/select-service/select-service.component';
import { SpecifyDetailsStepComponent } from './add-service-instance/specify-details-step/specify-details-step.component';
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
    CreateApplicationModule
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
})
export class ServiceCatalogModule { }
