import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { CloudFoundryPageComponent } from './cloud-foundry-page/cloud-foundry-page.component';

const cloudFoundry: Routes = [
  { path: '', component: CloudFoundryPageComponent, },
];

@NgModule({
  imports: [
    RouterModule.forChild(cloudFoundry),
  ]
})
export class CloudFoundryRoutingModule { }
