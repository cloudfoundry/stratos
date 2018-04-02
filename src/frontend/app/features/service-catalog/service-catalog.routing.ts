import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

const serviceCatalog: Routes = [
  {
    path: '',
    component: ServiceCatalogPageComponent,
  }];

@NgModule({
  imports: [
    RouterModule.forChild(serviceCatalog),
  ]
})
export class ServiceCatalogRoutingModule { }
