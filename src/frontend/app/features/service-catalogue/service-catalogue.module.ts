import { ServiceCatalogueRoutingModule } from './service-catalogue.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceCataloguePageComponent } from './service-catalogue-page/service-catalogue-page.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ServiceCatalogueRoutingModule
  ],
  declarations: [ServiceCataloguePageComponent]
})
export class ServiceCatalogueModule { }
