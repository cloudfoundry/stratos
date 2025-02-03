import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CloudFoundrySharedModule } from '../../cloud-foundry/src/shared/cf-shared.module';
import { CoreModule } from '../../core/src/core/core.module';
import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';
import { CardAutoscalerDefaultComponent } from './shared/card-autoscaler-default/card-autoscaler-default.component';

// Lazy-load module for the Autoscaler Tab
const tabRoute: Routes = [
  {
    path: '',
    component: AutoscalerTabExtensionComponent,
  },
];

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    MDAppModule,
    CloudFoundrySharedModule,
    NgxChartsModule,
    RouterModule.forChild(tabRoute),
  ],
  declarations: [
    CardAutoscalerDefaultComponent,
    AutoscalerTabExtensionComponent,
  ]
})
export class CfAutoscalerTabModule { }
