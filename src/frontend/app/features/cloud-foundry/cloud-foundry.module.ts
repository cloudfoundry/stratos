import { CloudFoundryRoutingModule } from './cloud-foundry.routing';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudFoundryPageComponent } from './cloud-foundry-page/cloud-foundry-page.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CloudFoundryRoutingModule
  ],
  declarations: [CloudFoundryPageComponent]
})
export class CloudFoundryModule { }
