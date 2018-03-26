import { ServiceCatalogRoutingModule } from './service-catalog.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ServiceCatalogRoutingModule
  ],
  declarations: [ServiceCatalogPageComponent]
})
export class ServiceCatalogModule { }
