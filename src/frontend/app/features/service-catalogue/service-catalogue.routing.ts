import { ServiceCataloguePageComponent } from './service-catalogue-page/service-catalogue-page.component';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

const serviceCatalogue: Routes = [
  {
    path: '',
    component: ServiceCataloguePageComponent,
  }];

@NgModule({
  imports: [
    RouterModule.forChild(serviceCatalogue),
  ]
})
export class ServiceCatalogueRoutingModule { }
