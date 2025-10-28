import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import {
  CreateApplicationModule,
} from '../../../../cloud-foundry/src/features/applications/create-application/create-application.module';
import { ServiceCatalogModule } from '../../../../cloud-foundry/src/features/service-catalog/service-catalog.module';
import { CoreModule } from '@stratosui/core';
import { SharedModule } from '@stratosui/core';
import { CloudFoundrySharedModule } from '../../shared/cf-shared.module';
import { DetachAppsComponent } from './detach-service-instance/detach-apps/detach-apps.component';
import { DetachServiceInstanceComponent } from './detach-service-instance/detach-service-instance.component';
import { ServicesWallComponent } from './services-wall/services-wall.component';
import { ServicesRoutingModule } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    ServicesRoutingModule,
    ServiceCatalogModule,
    CreateApplicationModule,
    CloudFoundrySharedModule,
    // Standalone components
    ServicesWallComponent,
    DetachServiceInstanceComponent,
    DetachAppsComponent
  ],
  declarations: [
  ],
  providers: [
    DatePipe
  ]
})
export class ServicesModule { }
