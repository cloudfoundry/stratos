import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { AddServiceInstanceComponent } from './add-service-instance/add-service-instance/add-service-instance.component';
import { BindAppsStepComponent } from './add-service-instance/bind-apps-step/bind-apps-step.component';
import { SelectPlanStepComponent } from './add-service-instance/select-plan-step/select-plan-step.component';
import { SpecifyDetailsStepComponent } from './add-service-instance/specify-details-step/specify-details-step.component';
import { ServiceBaseComponent } from './service-base/service-base.component';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { ServiceCatalogRoutingModule } from './service-catalog.routing';
import { ServiceInstancesComponent } from './service-instances/service-instances.component';
import { ServicePlansComponent } from './service-plans/service-plans.component';
import { ServiceBrokerCardComponent } from './service-summary/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from './service-summary/service-recent-instances-card/service-recent-instances-card.component';
import { ServiceSummaryCardComponent } from './service-summary/service-summary-card/service-summary-card.component';
import { ServiceSummaryComponent } from './service-summary/service-summary.component';
import { ServiceTabsBaseComponent } from './service-tabs-base/service-tabs-base.component';

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
    ServicePlansComponent,
    ServiceTabsBaseComponent,
    ServiceSummaryComponent,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent,
  ]
})
export class ServiceCatalogModule { }
