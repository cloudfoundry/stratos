import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';
import { ServicesWallComponent } from './services-wall/services-wall.component';
import { ServicesRoutingModule } from './services.routing';
import { CreateApplicationModule } from '../applications/create-application/create-application.module';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    ServicesRoutingModule,
    ServiceCatalogModule,
    CreateApplicationModule
  ],
  declarations: [ServicesWallComponent]
})
export class ServicesModule { }
