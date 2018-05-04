import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ServiceBaseComponent } from './service-base/service-base.component';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { ServiceCatalogRoutingModule } from './service-catalog.routing';
import { ServiceInstancesComponent } from './service-instances/service-instances.component';
import { SpecifyDetailsStepComponent } from './add-service-instance/specify-details-step/specify-details-step.component';
import { BindAppsStepComponent } from './add-service-instance/bind-apps-step/bind-apps-step.component';
import { AddServiceInstanceComponent } from './add-service-instance/add-service-instance/add-service-instance.component';
import { SelectPlanStepComponent } from './add-service-instance/select-plan-step/select-plan-step.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ServiceCatalogRoutingModule,
    CoreModule,
  ],
  declarations: [
    ServiceCatalogPageComponent,
    ServiceBaseComponent,
    ServiceInstancesComponent,
    SpecifyDetailsStepComponent,
    BindAppsStepComponent,
    AddServiceInstanceComponent,
    SelectPlanStepComponent,
  ]
})
export class ServiceCatalogModule { }
